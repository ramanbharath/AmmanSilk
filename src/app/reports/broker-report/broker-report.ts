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
  selector: 'app-broker-report',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, MatCardModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatTableModule, MatToolbarModule],
  template: `
    <div class="app-layout">
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <mat-toolbar color="primary">
          <mat-icon>people</mat-icon>&nbsp;
          <span>Broker Discount Report</span>
          <span class="badge-admin">ADMIN ONLY</span>
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

          <!-- Summary totals -->
          <div class="summary-strip" *ngIf="rows.length > 0">
            <div class="s-item">
              <span class="s-val">{{ totalBills }}</span>
              <span class="s-lbl">Total Bills via Brokers</span>
            </div>
            <div class="s-item">
              <span class="s-val">₹{{ totalSale | number:'1.0-0' }}</span>
              <span class="s-lbl">Total Sale via Brokers</span>
            </div>
            <div class="s-item orange">
              <span class="s-val">₹{{ totalDiscount | number:'1.0-0' }}</span>
              <span class="s-lbl">Total Broker Discount</span>
            </div>
          </div>

          <mat-card>
            <mat-card-title>Broker-wise Discount Breakdown</mat-card-title>
            <mat-card-content>
              <table mat-table [dataSource]="rows" class="full-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Broker Name</th>
                  <td mat-cell *matCellDef="let r"><strong>{{ r.broker_name }}</strong></td>
                </ng-container>
                <ng-container matColumnDef="bills">
                  <th mat-header-cell *matHeaderCellDef>Bills</th>
                  <td mat-cell *matCellDef="let r">{{ r.total_bills }}</td>
                </ng-container>
                <ng-container matColumnDef="sale">
                  <th mat-header-cell *matHeaderCellDef>Sale Value (₹)</th>
                  <td mat-cell *matCellDef="let r">₹{{ r.total_sale_value | number:'1.0-0' }}</td>
                </ng-container>
                <ng-container matColumnDef="discount">
                  <th mat-header-cell *matHeaderCellDef>Broker Discount (₹)</th>
                  <td mat-cell *matCellDef="let r">
                    <span class="disc-val">₹{{ r.total_broker_discount | number:'1.2-2' }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="pct">
                  <th mat-header-cell *matHeaderCellDef>Avg Discount %</th>
                  <td mat-cell *matCellDef="let r">{{ r.avg_discount_pct }}%</td>
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
    .badge-admin { font-size: 11px; background: #e65100; color: #fff; padding: 2px 8px; border-radius: 10px; margin-left: 12px; }
    .filter-card { padding: 4px; }
    .filter-row { display: flex; gap: 12px; align-items: center; padding: 8px; }
    .summary-strip { display: flex; gap: 16px; }
    .s-item { background: #fff3e0; border-radius: 8px; padding: 14px 20px; text-align: center; flex: 1; }
    .s-item.orange .s-val { color: #e65100; }
    .s-val { display: block; font-size: 22px; font-weight: 700; color: #1a237e; }
    .s-lbl { font-size: 12px; color: #666; }
    .full-table { width: 100%; }
    .disc-val { color: #e65100; font-weight: 700; font-size: 15px; }
  `]
})
export class BrokerReport implements OnInit {
  from = '';
  to = '';
  rows: any[] = [];
  cols = ['name', 'bills', 'sale', 'discount', 'pct'];

  get totalBills() { return this.rows.reduce((s, r) => s + +r.total_bills, 0); }
  get totalSale()  { return this.rows.reduce((s, r) => s + +r.total_sale_value, 0); }
  get totalDiscount() { return this.rows.reduce((s, r) => s + +r.total_broker_discount, 0); }

  constructor(private reportSvc: ReportService) {}

  ngOnInit(): void {
    const now = new Date();
    // Default: first of previous month → today so end-of-month bills are never missed
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    this.from = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth()+1).padStart(2,'0')}-01`;
    this.to = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    this.load();
  }
  load(): void { this.reportSvc.getBrokerReport(this.from, this.to).subscribe(r => this.rows = r); }
}
