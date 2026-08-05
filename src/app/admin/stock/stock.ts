import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { ProductService } from '../../shared/services/product';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, MatCardModule, MatTableModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSnackBarModule, MatToolbarModule],
  template: `
    <div class="app-layout">
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <mat-toolbar color="primary">
          <mat-icon>warehouse</mat-icon>&nbsp;
          <span>Stock Management</span>
        </mat-toolbar>
        <div class="content-body">
          <mat-card>
            <mat-card-content>
              <table mat-table [dataSource]="stock" class="full-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Saree Name</th>
                  <td mat-cell *matCellDef="let s"><strong>{{ s.name }}</strong></td>
                </ng-container>
                <ng-container matColumnDef="category">
                  <th mat-header-cell *matHeaderCellDef>Category</th>
                  <td mat-cell *matCellDef="let s">{{ s.category }}</td>
                </ng-container>
                <ng-container matColumnDef="price">
                  <th mat-header-cell *matHeaderCellDef>Selling Price (₹)</th>
                  <td mat-cell *matCellDef="let s">₹{{ s.selling_price | number }}</td>
                </ng-container>
                <ng-container matColumnDef="stock">
                  <th mat-header-cell *matHeaderCellDef>Current Stock</th>
                  <td mat-cell *matCellDef="let s">
                    <span [class.low]="s.stock <= 3" [class.ok]="s.stock > 3 && s.stock <= 10" [class.good]="s.stock > 10">
                      {{ s.stock }}
                    </span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="update">
                  <th mat-header-cell *matHeaderCellDef>Update Stock</th>
                  <td mat-cell *matCellDef="let s">
                    <div class="stock-update">
                      <input type="number" min="0" [(ngModel)]="s._newStock" [placeholder]="s.stock"
                             class="stock-input" (keyup.enter)="updateStock(s)">
                      <button mat-mini-fab color="primary" (click)="updateStock(s)" [disabled]="!s._newStock">
                        <mat-icon>check</mat-icon>
                      </button>
                    </div>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="cols"></tr>
                <tr mat-row *matRowDef="let row; columns: cols;" [class.row-low]="row.stock <= 3"></tr>
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
    .content-body { flex: 1; overflow: auto; padding: 16px; background: #f5f5f5; }
    .full-table { width: 100%; }
    .low  { color: #f44336; font-weight: 700; font-size: 15px; }
    .ok   { color: #f57c00; font-weight: 600; }
    .good { color: #2e7d32; font-weight: 600; }
    .row-low { background: #fff8f8 !important; }
    .stock-update { display: flex; align-items: center; gap: 8px; }
    .stock-input { width: 80px; padding: 6px 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; }
  `]
})
export class Stock implements OnInit {
  stock: any[] = [];
  cols = ['name', 'category', 'price', 'stock', 'update'];

  constructor(private productSvc: ProductService, private snack: MatSnackBar) {}

  ngOnInit(): void { this.load(); }
  load(): void { this.productSvc.getStock().subscribe(s => this.stock = s.map(i => ({ ...i, _newStock: null }))); }

  updateStock(s: any): void {
    if (s._newStock == null || s._newStock < 0) return;
    this.productSvc.updateStock(s.id, s._newStock).subscribe(() => {
      this.snack.open(`Stock updated for ${s.name}`, 'OK', { duration: 2000 });
      s.stock = s._newStock; s._newStock = null;
    });
  }
}
