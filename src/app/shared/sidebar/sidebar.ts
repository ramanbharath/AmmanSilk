import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../auth/services/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, MatIconModule, MatDividerModule],
  template: `
    <div class="sidebar">
      <div class="brand">
        <mat-icon class="brand-icon">diamond</mat-icon>
        <div>
          <div class="brand-name">AmmanSilks</div>
          <div class="brand-role">{{ auth.currentUser?.role }}</div>
        </div>
      </div>
      <mat-nav-list>
        <a mat-list-item routerLink="/billing/pos" routerLinkActive="active-link">
          <mat-icon matListItemIcon>point_of_sale</mat-icon>
          <span matListItemTitle>New Bill</span>
        </a>
        <a mat-list-item routerLink="/reports/invoices" routerLinkActive="active-link">
          <mat-icon matListItemIcon>receipt_long</mat-icon>
          <span matListItemTitle>Invoice List</span>
        </a>

        <ng-container *ngIf="auth.isAdmin">
          <mat-divider></mat-divider>
          <div class="section-label">ADMIN</div>
          <a mat-list-item routerLink="/admin/dashboard" routerLinkActive="active-link">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          <a mat-list-item routerLink="/admin/products" routerLinkActive="active-link">
            <mat-icon matListItemIcon>inventory_2</mat-icon>
            <span matListItemTitle>Products</span>
          </a>
          <a mat-list-item routerLink="/admin/customers" routerLinkActive="active-link">
            <mat-icon matListItemIcon>people</mat-icon>
            <span matListItemTitle>Customers</span>
          </a>
          <a mat-list-item routerLink="/admin/brokers" routerLinkActive="active-link">
            <mat-icon matListItemIcon>group</mat-icon>
            <span matListItemTitle>Brokers</span>
          </a>
          <a mat-list-item routerLink="/admin/stock" routerLinkActive="active-link">
            <mat-icon matListItemIcon>warehouse</mat-icon>
            <span matListItemTitle>Stock</span>
          </a>
          <a mat-list-item routerLink="/admin/users" routerLinkActive="active-link">
            <mat-icon matListItemIcon>manage_accounts</mat-icon>
            <span matListItemTitle>Users</span>
          </a>
          <mat-divider></mat-divider>
          <div class="section-label">REPORTS</div>
          <a mat-list-item routerLink="/reports/invoices" routerLinkActive="active-link">
            <mat-icon matListItemIcon>receipt_long</mat-icon>
            <span matListItemTitle>Invoice List</span>
          </a>
          <a mat-list-item routerLink="/reports/sales" routerLinkActive="active-link">
            <mat-icon matListItemIcon>bar_chart</mat-icon>
            <span matListItemTitle>Sales Report</span>
          </a>
          <a mat-list-item routerLink="/reports/broker" routerLinkActive="active-link">
            <mat-icon matListItemIcon>people</mat-icon>
            <span matListItemTitle>Broker Report</span>
          </a>
          <a mat-list-item routerLink="/reports/customer" routerLinkActive="active-link">
            <mat-icon matListItemIcon>person_search</mat-icon>
            <span matListItemTitle>Customer Report</span>
          </a>
        </ng-container>
      </mat-nav-list>
      <div class="logout-area">
        <button mat-button (click)="logout()" class="logout-btn">
          <mat-icon>logout</mat-icon> Logout ({{ auth.currentUser?.name }})
        </button>
      </div>
    </div>
  `,
  styles: [`
    .sidebar { display: flex; flex-direction: column; height: 100%; background: #1a237e; color: #fff; width: 240px; }
    .brand { display: flex; align-items: center; gap: 10px; padding: 20px 16px 12px; }
    .brand-icon { font-size: 32px; width: 32px; height: 32px; color: #f8bbd0; }
    .brand-name { font-size: 18px; font-weight: 700; color: #fff; }
    .brand-role { font-size: 11px; color: #9fa8da; text-transform: uppercase; letter-spacing: 1px; }
    mat-nav-list { flex: 1; overflow-y: auto; }
    .section-label { font-size: 10px; color: #9fa8da; padding: 8px 16px 4px; letter-spacing: 1.5px; }
    .active-link { background: rgba(255,255,255,0.15) !important; border-radius: 4px; }
    mat-icon, span { color: #e8eaf6 !important; }
    .logout-area { padding: 12px; border-top: 1px solid rgba(255,255,255,0.1); }
    .logout-btn { color: #ef9a9a !important; width: 100%; text-align: left; }
  `]
})
export class Sidebar {
  constructor(public auth: AuthService) {}
  logout(): void { this.auth.logout(); window.location.href = '/login'; }
}
