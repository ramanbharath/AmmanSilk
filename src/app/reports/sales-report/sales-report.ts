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
import { MatDividerModule } from '@angular/material/divider';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { ReportService } from '../../shared/services/report';

@Component({
  selector: 'app-sales-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Sidebar, MatCardModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatToolbarModule, MatTableModule, MatDividerModule],
  template: `
    <div class="app-layout">
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <mat-toolbar color="primary">
          <mat-icon>bar_chart</mat-icon>&nbsp;
          <span>Sales Report</span>
          <span class="spacer"></span>
          <button mat-raised-button (click)="exportCsv()" style="background:#e8f5e9; color:#2e7d32" [disabled]="!report">
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
                <mat-icon>search</mat-icon> Generate Report
              </button>
            </div>
          </mat-card>

          <ng-container *ngIf="report">
            <!-- KPI Cards -->
            <div class="kpi-row">
              <div class="kpi-card blue">
                <div class="kpi-val">{{ report.total_bills }}</div>
                <div class="kpi-lbl">Total Bills</div>
              </div>
              <div class="kpi-card navy">
                <div class="kpi-val">₹{{ report.total_gross | number:'1.0-0' }}</div>
                <div class="kpi-lbl">Gross Sales</div>
              </div>
              <div class="kpi-card red">
                <div class="kpi-val">₹{{ report.total_customer_discount | number:'1.0-0' }}</div>
                <div class="kpi-lbl">Customer Discounts</div>
              </div>
              <div class="kpi-card orange">
                <div class="kpi-val">₹{{ report.total_broker_discount | number:'1.0-0' }}</div>
                <div class="kpi-lbl">Broker Discounts</div>
              </div>
              <div class="kpi-card purple">
                <div class="kpi-val">₹{{ report.total_gst | number:'1.0-0' }}</div>
                <div class="kpi-lbl">GST Collected</div>
              </div>
              <div class="kpi-card green">
                <div class="kpi-val">₹{{ report.net_revenue | number:'1.0-0' }}</div>
                <div class="kpi-lbl">Net Revenue</div>
              </div>
            </div>

            <!-- Financial Breakdown -->
            <mat-card>
              <mat-card-title>Financial Breakdown</mat-card-title>
              <mat-card-content>
                <table class="breakdown-table">
                  <tr><td>Gross Sales</td><td class="val">₹{{ report.total_gross | number:'1.2-2' }}</td></tr>
                  <tr class="disc-row"><td>Less: Customer Discounts</td><td class="val red">- ₹{{ report.total_customer_discount | number:'1.2-2' }}</td></tr>
                  <tr class="disc-row"><td>Less: Broker Discounts (Internal)</td><td class="val orange">- ₹{{ report.total_broker_discount | number:'1.2-2' }}</td></tr>
                  <tr><td>GST Collected</td><td class="val">+ ₹{{ report.total_gst | number:'1.2-2' }}</td></tr>
                  <tr class="net-row"><td><strong>Net Revenue</strong></td><td class="val green"><strong>₹{{ report.net_revenue | number:'1.2-2' }}</strong></td></tr>
                </table>
              </mat-card-content>
            </mat-card>

            <!-- Product-wise Breakdown -->
            <mat-card *ngIf="report.products?.length > 0">
              <mat-card-title><mat-icon>inventory_2</mat-icon> Product-wise Sales</mat-card-title>
              <mat-card-content>
                <table mat-table [dataSource]="report.products" class="full-table">
                  <ng-container matColumnDef="product_name">
                    <th mat-header-cell *matHeaderCellDef>Product Name</th>
                    <td mat-cell *matCellDef="let p"><strong>{{ p.product_name }}</strong></td>
                  </ng-container>
                  <ng-container matColumnDef="category">
                    <th mat-header-cell *matHeaderCellDef>Category</th>
                    <td mat-cell *matCellDef="let p"><span class="chip">{{ p.category }}</span></td>
                  </ng-container>
                  <ng-container matColumnDef="total_qty">
                    <th mat-header-cell *matHeaderCellDef>Qty Sold</th>
                    <td mat-cell *matCellDef="let p">{{ p.total_qty }}</td>
                  </ng-container>
                  <ng-container matColumnDef="total_amount">
                    <th mat-header-cell *matHeaderCellDef>Total Amount (₹)</th>
                    <td mat-cell *matCellDef="let p"><strong>₹{{ p.total_amount | number:'1.2-2' }}</strong></td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="productCols"></tr>
                  <tr mat-row *matRowDef="let row; columns: productCols;"></tr>
                </table>
              </mat-card-content>
            </mat-card>

            <!-- Invoice List -->
            <mat-card *ngIf="report.invoices?.length > 0">
              <mat-card-title><mat-icon>receipt_long</mat-icon> Invoice List ({{ report.invoices.length }})</mat-card-title>
              <mat-card-content>
                <table mat-table [dataSource]="report.invoices" class="full-table">
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
                    <td mat-cell *matCellDef="let inv">{{ inv.customer_name }}<br><small>{{ inv.customer_mobile }}</small></td>
                  </ng-container>
                  <ng-container matColumnDef="payment_mode">
                    <th mat-header-cell *matHeaderCellDef>Payment</th>
                    <td mat-cell *matCellDef="let inv"><span class="chip">{{ inv.payment_mode }}</span></td>
                  </ng-container>
                  <ng-container matColumnDef="net_payable">
                    <th mat-header-cell *matHeaderCellDef>Amount (₹)</th>
                    <td mat-cell *matCellDef="let inv"><strong class="amt">₹{{ inv.net_payable | number:'1.2-2' }}</strong></td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="invoiceCols"></tr>
                  <tr mat-row *matRowDef="let row; columns: invoiceCols;"></tr>
                </table>
              </mat-card-content>
            </mat-card>
          </ng-container>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .app-layout { display: flex; height: 100vh; overflow: hidden; }
    .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .content-body { flex: 1; overflow: auto; padding: 16px; background: #f5f5f5; display: flex; flex-direction: column; gap: 12px; }
    .filter-card { padding: 4px; }
    .filter-row { display: flex; gap: 12px; align-items: center; padding: 8px; flex-wrap: wrap; }
    .spacer { flex: 1; }
    .kpi-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
    @media (max-width: 1100px) { .kpi-row { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 700px)  { .kpi-row { grid-template-columns: repeat(2, 1fr); } }
    .kpi-card { padding: 16px; border-radius: 8px; text-align: center; }
    .kpi-val { font-size: 20px; font-weight: 700; }
    .kpi-lbl { font-size: 11px; color: #555; margin-top: 4px; }
    .kpi-card.blue   { background: #e3f2fd; } .kpi-card.blue   .kpi-val { color: #1565c0; }
    .kpi-card.navy   { background: #e8eaf6; } .kpi-card.navy   .kpi-val { color: #1a237e; }
    .kpi-card.red    { background: #ffebee; } .kpi-card.red    .kpi-val { color: #c62828; }
    .kpi-card.orange { background: #fff3e0; } .kpi-card.orange .kpi-val { color: #e65100; }
    .kpi-card.purple { background: #f3e5f5; } .kpi-card.purple .kpi-val { color: #6a1b9a; }
    .kpi-card.green  { background: #e8f5e9; } .kpi-card.green  .kpi-val { color: #2e7d32; }
    .breakdown-table { width: 100%; max-width: 500px; border-collapse: collapse; }
    .breakdown-table tr { border-bottom: 1px solid #f0f0f0; }
    .breakdown-table td { padding: 10px 8px; font-size: 14px; }
    .val { text-align: right; font-weight: 600; }
    .disc-row { background: #fafafa; }
    .net-row { background: #e8f5e9; font-size: 16px; }
    .full-table { width: 100%; }
    .chip { background: #ede7f6; color: #512da8; padding: 2px 8px; border-radius: 10px; font-size: 12px; }
    .inv-link { color: #1565c0; font-weight: 600; text-decoration: none; }
    .inv-link:hover { text-decoration: underline; }
    .amt { color: #1a237e; }
    mat-card-title { display: flex; align-items: center; gap: 6px; font-size: 15px; margin-bottom: 12px; }
    .red { color: #e53935; } .orange { color: #e65100; } .green { color: #2e7d32; }
  `]
})
export class SalesReport implements OnInit {
  from = '';
  to = '';
  report: any = null;
  productCols = ['product_name', 'category', 'total_qty', 'total_amount'];
  invoiceCols  = ['invoice_number', 'date', 'customer_name', 'payment_mode', 'net_payable'];

  constructor(private reportSvc: ReportService) {}

  ngOnInit(): void {
    const now = new Date();
    // Default: first of previous month → today so end-of-month bills are never missed
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    this.from = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth()+1).padStart(2,'0')}-01`;
    this.to = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    this.load();
  }

  load(): void {
    this.reportSvc.getSalesReport(this.from, this.to).subscribe(r => this.report = r);
  }

  exportCsv(): void {
    if (!this.report) return;
    const summaryRows = [
      ['Period', `${this.from} to ${this.to}`],
      ['Total Bills', this.report.total_bills],
      ['Gross Sales', this.report.total_gross],
      ['Customer Discounts', this.report.total_customer_discount],
      ['Broker Discounts (Internal)', this.report.total_broker_discount],
      ['GST Collected', this.report.total_gst],
      ['Net Revenue', this.report.net_revenue],
      [],
      ['--- Product-wise Sales ---'],
      ['Product', 'Category', 'Qty Sold', 'Total Amount'],
      ...(this.report.products || []).map((p: any) => [p.product_name, p.category, p.total_qty, p.total_amount]),
      [],
      ['--- Invoice List ---'],
      ['Invoice #', 'Date', 'Customer', 'Mobile', 'Payment', 'Net Payable'],
      ...(this.report.invoices || []).map((i: any) => [i.invoice_number, i.date?.split('T')[0] || i.date, i.customer_name, i.customer_mobile, i.payment_mode, i.net_payable])
    ];
    const csv = summaryRows.map(r => (r as any[]).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `sales_report_${this.from}_${this.to}.csv`; a.click();
    URL.revokeObjectURL(url);
  }
}
