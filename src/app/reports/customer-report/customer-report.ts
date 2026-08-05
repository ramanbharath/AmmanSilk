import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { ReportService } from '../../shared/services/report';

@Component({
  selector: 'app-customer-report',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, MatCardModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatTableModule, MatToolbarModule],
  template: `
    <div class="app-layout">
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <mat-toolbar color="primary">
          <mat-icon>person_search</mat-icon>&nbsp;
          <span>Customer Discount Report</span>
        </mat-toolbar>
        <div class="content-body">
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
                <mat-icon>search</mat-icon> Generate
              </button>
            </div>
          </mat-card>

          <!-- Summary -->
          <div class="summary-strip" *ngIf="rows.length > 0">
            <div class="s-item blue">
              <span class="s-val">{{ rows.length }}</span>
              <span class="s-lbl">Unique Customers</span>
            </div>
            <div class="s-item navy">
              <span class="s-val">{{ totalBills }}</span>
              <span class="s-lbl">Total Bills</span>
            </div>
            <div class="s-item green">
              <span class="s-val">₹{{ totalPurchase | number:'1.0-0' }}</span>
              <span class="s-lbl">Total Purchase Value</span>
            </div>
            <div class="s-item red">
              <span class="s-val">₹{{ totalDiscount | number:'1.0-0' }}</span>
              <span class="s-lbl">Total Customer Discounts</span>
            </div>
          </div>

          <mat-card>
            <mat-card-title>Customer-wise Discount Breakdown</mat-card-title>
            <mat-card-content>
              <table mat-table [dataSource]="rows" class="full-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Customer Name</th>
                  <td mat-cell *matCellDef="let r"><strong>{{ r.customer_name }}</strong></td>
                </ng-container>
                <ng-container matColumnDef="mobile">
                  <th mat-header-cell *matHeaderCellDef>Mobile</th>
                  <td mat-cell *matCellDef="let r">{{ r.mobile }}</td>
                </ng-container>
                <ng-container matColumnDef="bills">
                  <th mat-header-cell *matHeaderCellDef>Bills</th>
                  <td mat-cell *matCellDef="let r">{{ r.total_bills }}</td>
                </ng-container>
                <ng-container matColumnDef="purchase">
                  <th mat-header-cell *matHeaderCellDef>Total Purchase (₹)</th>
                  <td mat-cell *matCellDef="let r">₹{{ r.total_purchase | number:'1.0-0' }}</td>
                </ng-container>
                <ng-container matColumnDef="discount">
                  <th mat-header-cell *matHeaderCellDef>Customer Discount (₹)</th>
                  <td mat-cell *matCellDef="let r">
                    <span class="disc-val">₹{{ r.total_customer_discount | number:'1.2-2' }}</span>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="cols"></tr>
                <tr mat-row *matRowDef="let row; columns: cols;"></tr>
              </table>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .app-layout { display: flex; height: 100vh; overflow: hidden; }
    .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .content-body { flex: 1; overflow: auto; padding: 16px; background: #f5f5f5; display: flex; flex-direction: column; gap: 12px; }
    .filter-card { padding: 4px; }
    .filter-row { display: flex; gap: 12px; align-items: center; padding: 8px; }
    .summary-strip { display: flex; gap: 16px; }
    .s-item { border-radius: 8px; padding: 14px 20px; text-align: center; flex: 1; }
    .s-item.blue  { background: #e3f2fd; } .s-item.blue  .s-val { color: #1565c0; }
    .s-item.navy  { background: #e8eaf6; } .s-item.navy  .s-val { color: #1a237e; }
    .s-item.green { background: #e8f5e9; } .s-item.green .s-val { color: #2e7d32; }
    .s-item.red   { background: #ffebee; } .s-item.red   .s-val { color: #c62828; }
    .s-val { display: block; font-size: 22px; font-weight: 700; }
    .s-lbl { font-size: 12px; color: #666; }
    .full-table { width: 100%; }
    .disc-val { color: #e53935; font-weight: 700; font-size: 15px; }
  `]
})
export class CustomerReport implements OnInit {
  from = '';
  to = '';
  rows: any[] = [];
  cols = ['name', 'mobile', 'bills', 'purchase', 'discount'];

  get totalBills()    { return this.rows.reduce((s, r) => s + +r.total_bills, 0); }
  get totalPurchase() { return this.rows.reduce((s, r) => s + +r.total_purchase, 0); }
  get totalDiscount() { return this.rows.reduce((s, r) => s + +r.total_customer_discount, 0); }

  constructor(private reportSvc: ReportService) {}

  ngOnInit(): void {
    const now = new Date();
    // Default: first of previous month → today so end-of-month bills are never missed
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    this.from = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth()+1).padStart(2,'0')}-01`;
    this.to = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    this.load();
  }
  load(): void { this.reportSvc.getCustomerReport(this.from, this.to).subscribe(r => this.rows = r); }
}
