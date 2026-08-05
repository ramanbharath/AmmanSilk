import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTableModule } from '@angular/material/table';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { BillingService } from '../../shared/services/billing';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Sidebar,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatToolbarModule, MatTableModule],
  template: `
    <div class="app-layout">
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <mat-toolbar color="primary">
          <mat-icon>receipt_long</mat-icon>&nbsp;
          <span>Invoice List</span>
          <span class="spacer"></span>
          <button mat-raised-button routerLink="/billing/pos" style="background:#fff; color:#1a237e">
            <mat-icon>add</mat-icon> New Bill
          </button>
          <button mat-raised-button (click)="exportCsv()" style="background:#e8f5e9; color:#2e7d32" [disabled]="invoices.length === 0">
            <mat-icon>download</mat-icon> Export CSV
          </button>
        </mat-toolbar>

        <div class="content-body">
          <!-- Date Filter -->
          <mat-card class="filter-card">
            <div class="filter-row">
              <mat-form-field appearance="outline">
                <mat-label>From Date</mat-label>
                <input matInput type="date" [(ngModel)]="from">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>To Date</mat-label>
                <input matInput type="date" [(ngModel)]="to">
              </mat-form-field>
              <button mat-raised-button color="primary" (click)="load()">
                <mat-icon>search</mat-icon> Search
              </button>
            </div>
          </mat-card>

          <!-- Invoice Table -->
          <mat-card>
            <mat-card-title>
              <mat-icon>list_alt</mat-icon>
              {{ invoices.length }} Invoice(s)
            </mat-card-title>
            <mat-card-content>
              <table mat-table [dataSource]="invoices" class="full-table" *ngIf="invoices.length > 0; else noData">
                <ng-container matColumnDef="invoice_number">
                  <th mat-header-cell *matHeaderCellDef>Invoice #</th>
                  <td mat-cell *matCellDef="let inv">
                    <a [routerLink]="['/billing/invoice', inv.id]" class="inv-link">{{ inv.invoice_number }}</a>
                  </td>
                </ng-container>
                <ng-container matColumnDef="date">
                  <th mat-header-cell *matHeaderCellDef>Date</th>
                  <td mat-cell *matCellDef="let inv">{{ inv.date | date:'dd/MM/yyyy' }}</td>
                </ng-container>
                <ng-container matColumnDef="customer_name">
                  <th mat-header-cell *matHeaderCellDef>Customer</th>
                  <td mat-cell *matCellDef="let inv">
                    <strong>{{ inv.customer_name }}</strong><br>
                    <small>{{ inv.customer_mobile }}</small>
                  </td>
                </ng-container>
                <ng-container matColumnDef="broker_name">
                  <th mat-header-cell *matHeaderCellDef>Broker</th>
                  <td mat-cell *matCellDef="let inv">{{ inv.broker_name || '—' }}</td>
                </ng-container>
                <ng-container matColumnDef="payment_mode">
                  <th mat-header-cell *matHeaderCellDef>Payment</th>
                  <td mat-cell *matCellDef="let inv"><span class="chip">{{ inv.payment_mode }}</span></td>
                </ng-container>
                <ng-container matColumnDef="net_payable">
                  <th mat-header-cell *matHeaderCellDef>Amount (₹)</th>
                  <td mat-cell *matCellDef="let inv"><strong class="amt">₹{{ inv.net_payable | number:'1.2-2' }}</strong></td>
                </ng-container>
                <ng-container matColumnDef="created_by_name">
                  <th mat-header-cell *matHeaderCellDef>Billed By</th>
                  <td mat-cell *matCellDef="let inv"><small>{{ inv.created_by_name }}</small></td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="cols"></tr>
                <tr mat-row *matRowDef="let row; columns: cols;" class="inv-row"
                    [routerLink]="['/billing/invoice', row.id]"></tr>
              </table>
              <ng-template #noData>
                <div class="no-data">No invoices found for selected period.</div>
              </ng-template>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .app-layout { display: flex; height: 100vh; overflow: hidden; }
    .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .spacer { flex: 1; }
    .content-body { flex: 1; overflow: auto; padding: 16px; background: #f5f5f5; display: flex; flex-direction: column; gap: 12px; }
    .filter-card { padding: 4px; }
    .filter-row { display: flex; gap: 12px; align-items: center; padding: 8px; flex-wrap: wrap; }
    .full-table { width: 100%; }
    mat-card-title { display: flex; align-items: center; gap: 6px; font-size: 15px; margin-bottom: 12px; }
    .chip { background: #e3f2fd; color: #1565c0; padding: 2px 8px; border-radius: 10px; font-size: 12px; }
    .inv-link { color: #1565c0; font-weight: 600; text-decoration: none; }
    .inv-link:hover { text-decoration: underline; }
    .amt { color: #1a237e; font-size: 15px; }
    .inv-row:hover { background: #f5f5f5; cursor: pointer; }
    .no-data { padding: 32px; text-align: center; color: #888; }
  `]
})
export class InvoiceList implements OnInit {
  invoices: any[] = [];
  cols = ['invoice_number', 'date', 'customer_name', 'broker_name', 'payment_mode', 'net_payable', 'created_by_name'];
  from = '';
  to = '';

  constructor(private billingSvc: BillingService) {}

  ngOnInit(): void {
    const now = new Date();
    // Default: first of previous month → today so end-of-month bills are never missed
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    this.from = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth()+1).padStart(2,'0')}-01`;
    this.to = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    this.load();
  }

  load(): void {
    this.billingSvc.getInvoices(this.from, this.to).subscribe(r => this.invoices = r);
  }

  exportCsv(): void {
    const header = ['Invoice #', 'Date', 'Customer', 'Mobile', 'Broker', 'Payment', 'Subtotal', 'Customer Discount', 'GST', 'Net Payable', 'Billed By'];
    const rows = this.invoices.map(i => [
      i.invoice_number, i.date?.split('T')[0] || i.date, i.customer_name, i.customer_mobile,
      i.broker_name || '', i.payment_mode, i.subtotal, i.customer_discount_amt, i.gst_amount, i.net_payable, i.created_by_name
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `invoices_${this.from}_${this.to}.csv`; a.click();
    URL.revokeObjectURL(url);
  }
}
