import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { BillingService } from '../../shared/services/billing';
import { ReportService } from '../../shared/services/report';
import { ProductService } from '../../shared/services/product';
import { AuthService } from '../../auth/services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, Sidebar, MatCardModule, MatIconModule, RouterModule, MatButtonModule],
  template: `
    <div class="app-layout">
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <div class="dash-header">
          <h2><mat-icon>dashboard</mat-icon> Dashboard</h2>
          <span>Welcome, {{ auth.currentUser?.name }}</span>
        </div>
        <div class="kpi-grid">
          <mat-card class="kpi-card blue">
            <mat-icon class="kpi-icon">receipt_long</mat-icon>
            <div class="kpi-value">{{ summary?.total_bills || 0 }}</div>
            <div class="kpi-label">Total Bills (This Month)</div>
          </mat-card>
          <mat-card class="kpi-card green">
            <mat-icon class="kpi-icon">currency_rupee</mat-icon>
            <div class="kpi-value">₹{{ (summary?.net_revenue | number:'1.0-0') || '0' }}</div>
            <div class="kpi-label">Net Revenue</div>
          </mat-card>
          <mat-card class="kpi-card red">
            <mat-icon class="kpi-icon">local_offer</mat-icon>
            <div class="kpi-value">₹{{ (summary?.total_customer_discount | number:'1.0-0') || '0' }}</div>
            <div class="kpi-label">Customer Discounts</div>
          </mat-card>
          <mat-card class="kpi-card orange">
            <mat-icon class="kpi-icon">people</mat-icon>
            <div class="kpi-value">₹{{ (summary?.total_broker_discount | number:'1.0-0') || '0' }}</div>
            <div class="kpi-label">Broker Discounts</div>
          </mat-card>
        </div>

        <div class="quick-links">
          <h3>Quick Actions</h3>
          <div class="link-grid">
            <button mat-raised-button color="primary" routerLink="/billing/pos">
              <mat-icon>point_of_sale</mat-icon> New Bill
            </button>
            <button mat-raised-button routerLink="/admin/products">
              <mat-icon>inventory_2</mat-icon> Products
            </button>
            <button mat-raised-button routerLink="/admin/brokers">
              <mat-icon>group</mat-icon> Brokers
            </button>
            <button mat-raised-button routerLink="/admin/stock">
              <mat-icon>warehouse</mat-icon> Stock
            </button>
            <button mat-raised-button color="accent" routerLink="/reports/sales">
              <mat-icon>bar_chart</mat-icon> Sales Report
            </button>
            <button mat-raised-button routerLink="/reports/broker">
              <mat-icon>people</mat-icon> Broker Report
            </button>
          </div>
        </div>

        <!-- Low Stock Alert -->
        <div class="low-stock-alert" *ngIf="lowStockItems.length > 0">
          <h3><mat-icon style="color:#f44336;vertical-align:middle">warning</mat-icon> Low Stock Alert ({{ lowStockItems.length }} items)</h3>
          <div class="low-stock-grid">
            <div class="low-stock-item" *ngFor="let s of lowStockItems">
              <strong>{{ s.name }}</strong>
              <span class="chip">{{ s.category }}</span>
              <span class="stock-num" [class.zero]="s.stock === 0">{{ s.stock }} left</span>
            </div>
          </div>
        </div>

        <!-- Recent Bills -->
        <div class="recent-bills" *ngIf="recentBills.length > 0">
          <h3>Recent Bills</h3>
          <table class="bills-table">
            <thead><tr><th>Invoice No</th><th>Customer</th><th>Date</th><th>Net Payable</th><th>Payment</th></tr></thead>
            <tbody>
              <tr *ngFor="let b of recentBills">
                <td><a [routerLink]="['/billing/invoice', b.id]">{{ b.invoice_number }}</a></td>
                <td>{{ b.customer_name }}</td>
                <td>{{ b.date | date:'dd/MM/yyyy' }}</td>
                <td><strong>₹{{ b.net_payable | number:'1.2-2' }}</strong></td>
                <td>{{ b.payment_mode }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .app-layout { display: flex; height: 100vh; overflow: hidden; }
    .main-content { flex: 1; overflow: auto; padding: 0; background: #f5f5f5; }
    .dash-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px 12px; background: #fff; border-bottom: 1px solid #e0e0e0; }
    .dash-header h2 { display: flex; align-items: center; gap: 6px; margin: 0; font-size: 20px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding: 20px 24px; }
    .kpi-card { padding: 20px; border-radius: 10px; text-align: center; position: relative; }
    .kpi-icon { font-size: 36px; width: 36px; height: 36px; margin-bottom: 8px; opacity: 0.8; }
    .kpi-value { font-size: 26px; font-weight: 700; }
    .kpi-label { font-size: 12px; color: #666; margin-top: 4px; }
    .kpi-card.blue { background: #e3f2fd; } .kpi-card.blue .kpi-icon, .kpi-card.blue .kpi-value { color: #1565c0; }
    .kpi-card.green { background: #e8f5e9; } .kpi-card.green .kpi-icon, .kpi-card.green .kpi-value { color: #2e7d32; }
    .kpi-card.red { background: #ffebee; } .kpi-card.red .kpi-icon, .kpi-card.red .kpi-value { color: #c62828; }
    .kpi-card.orange { background: #fff3e0; } .kpi-card.orange .kpi-icon, .kpi-card.orange .kpi-value { color: #e65100; }
    .quick-links { padding: 0 24px 20px; }
    .quick-links h3 { margin-bottom: 12px; }
    .link-grid { display: flex; flex-wrap: wrap; gap: 10px; }
    .low-stock-alert { padding: 0 24px 20px; }
    .low-stock-alert h3 { margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
    .low-stock-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .low-stock-item { background: #fff3e0; border: 1px solid #ffcc02; border-radius: 6px; padding: 8px 12px; display: flex; align-items: center; gap: 8px; font-size: 13px; }
    .chip { background: #ede7f6; color: #512da8; padding: 1px 7px; border-radius: 10px; font-size: 11px; }
    .stock-num { font-weight: 700; color: #e65100; }
    .stock-num.zero { color: #c62828; }
    .recent-bills { padding: 0 24px 24px; }
    .recent-bills h3 { margin-bottom: 12px; }
    .bills-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
    .bills-table th { background: #1a237e; color: #fff; padding: 10px 12px; text-align: left; font-size: 13px; }
    .bills-table td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
    .bills-table a { color: #1565c0; text-decoration: none; font-weight: 600; }
  `]
})
export class Dashboard implements OnInit {
  summary: any = null;
  recentBills: any[] = [];
  lowStockItems: any[] = [];

  constructor(
    public auth: AuthService,
    private reportSvc: ReportService,
    private billingSvc: BillingService,
    private productSvc: ProductService
  ) {}

  ngOnInit(): void {
    const now = new Date();
    // Default: first of the PREVIOUS month → today, so last-day-of-month invoices are never dropped
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const from = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth()+1).padStart(2,'0')}-01`;
    const to = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    this.reportSvc.getSalesReport(from, to).subscribe(s => this.summary = s);
    this.billingSvc.getInvoices(from, to).subscribe(b => this.recentBills = b.slice(0, 10));
    this.productSvc.getStock().subscribe(s => {
      this.lowStockItems = s.filter((p: any) => p.stock <= 5);
    });
  }
}
