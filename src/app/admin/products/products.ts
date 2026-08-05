import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { ProductService } from '../../shared/services/product';
import { Product } from '../../shared/models/models';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Sidebar,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSnackBarModule, MatToolbarModule],
  template: `
    <div class="app-layout">
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <mat-toolbar color="primary">
          <mat-icon>inventory_2</mat-icon>&nbsp;
          <span>Product Management</span>
          <span class="spacer"></span>
          <button mat-raised-button (click)="openForm()" style="background:#fff; color:#1a237e">
            <mat-icon>add</mat-icon> Add Product
          </button>
        </mat-toolbar>

        <div class="content-body">
          <!-- Add/Edit Form -->
          <mat-card class="form-card" *ngIf="showForm">
            <mat-card-title>{{ editId ? 'Edit' : 'Add New' }} Saree</mat-card-title>
            <mat-card-content>
              <form [formGroup]="productForm" (ngSubmit)="saveProduct()">
                 <div class="row-3">
                   <mat-form-field appearance="outline">
                     <mat-label>Saree Name *</mat-label>
                     <input matInput formControlName="name">
                   </mat-form-field>
                   <mat-form-field appearance="outline">
                     <mat-label>Category *</mat-label>
                     <mat-select formControlName="category">
                       <mat-option *ngFor="let c of categories" [value]="c">{{ c }}</mat-option>
                     </mat-select>
                   </mat-form-field>
                   <mat-form-field appearance="outline">
                     <mat-label>HSN Code</mat-label>
                     <input matInput formControlName="hsnCode">
                   </mat-form-field>
                 </div>
                 <div class="row-4">
                   <mat-form-field appearance="outline">
                     <mat-label>Cost Price (₹) *</mat-label>
                     <input matInput type="number" formControlName="costPrice">
                   </mat-form-field>
                   <mat-form-field appearance="outline">
                     <mat-label>Selling Price (₹) *</mat-label>
                     <input matInput type="number" formControlName="sellingPrice">
                   </mat-form-field>
                   <mat-form-field appearance="outline">
                     <mat-label>Stock Qty *</mat-label>
                     <input matInput type="number" formControlName="stock">
                   </mat-form-field>
                   <mat-form-field appearance="outline">
                     <mat-label>GST Rate</mat-label>
                     <mat-select formControlName="gstRate">
                       <mat-option [value]="0">0%</mat-option>
                       <mat-option [value]="5">5%</mat-option>
                       <mat-option [value]="12">12%</mat-option>
                     </mat-select>
                   </mat-form-field>
                 </div>
                 <div class="row-2">
                   <mat-form-field appearance="outline" class="flex-1">
                     <mat-label>Description</mat-label>
                     <textarea matInput formControlName="description" rows="2"></textarea>
                   </mat-form-field>
                   <mat-form-field appearance="outline" class="flex-1">
                     <mat-label>Image URL (optional)</mat-label>
                     <input matInput formControlName="imageUrl" placeholder="https://...">
                   </mat-form-field>
                 </div>
                <div class="form-actions">
                  <button mat-raised-button color="primary" type="submit" [disabled]="productForm.invalid">
                    <mat-icon>save</mat-icon> {{ editId ? 'Update' : 'Save' }}
                  </button>
                  <button mat-stroked-button type="button" (click)="cancelForm()">Cancel</button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>

          <!-- Products Table -->
          <mat-card>
            <mat-card-content>
              <table mat-table [dataSource]="products" class="full-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let p"><strong>{{ p.name }}</strong></td>
                </ng-container>
                <ng-container matColumnDef="category">
                  <th mat-header-cell *matHeaderCellDef>Category</th>
                  <td mat-cell *matCellDef="let p"><span class="chip">{{ p.category }}</span></td>
                </ng-container>
                <ng-container matColumnDef="costPrice">
                  <th mat-header-cell *matHeaderCellDef>Cost (₹)</th>
                  <td mat-cell *matCellDef="let p">{{ p.costPrice | number }}</td>
                </ng-container>
                <ng-container matColumnDef="sellingPrice">
                  <th mat-header-cell *matHeaderCellDef>Selling (₹)</th>
                  <td mat-cell *matCellDef="let p"><strong>{{ p.sellingPrice | number }}</strong></td>
                </ng-container>
                <ng-container matColumnDef="stock">
                  <th mat-header-cell *matHeaderCellDef>Stock</th>
                  <td mat-cell *matCellDef="let p">
                    <span [class.low-stock]="p.stock <= 3" [class.ok-stock]="p.stock > 3">
                      {{ p.stock }}
                    </span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="gst">
                  <th mat-header-cell *matHeaderCellDef>GST</th>
                  <td mat-cell *matCellDef="let p">{{ p.gstRate }}%</td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let p">
                    <button mat-icon-button color="primary" (click)="editProduct(p)"><mat-icon>edit</mat-icon></button>
                    <button mat-icon-button color="warn" (click)="deleteProduct(p.id)"><mat-icon>delete</mat-icon></button>
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
    .spacer { flex: 1; }
    .content-body { flex: 1; overflow: auto; padding: 16px; background: #f5f5f5; display: flex; flex-direction: column; gap: 12px; }
    .form-card { border-left: 4px solid #1a237e; }
    .row-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 8px; }
    .flex-1 { flex: 1; }
    .row-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .row-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 8px; }
    @media (max-width: 900px) {
      .row-3, .row-4, .row-2 { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 600px) {
      .row-3, .row-4, .row-2 { grid-template-columns: 1fr; }
    }
    .form-actions { display: flex; gap: 10px; margin-top: 8px; }
    .full-table { width: 100%; }
    .chip { background: #ede7f6; color: #512da8; padding: 2px 8px; border-radius: 10px; font-size: 12px; }
    .low-stock { color: #f44336; font-weight: 700; }
    .ok-stock { color: #2e7d32; font-weight: 600; }
  `]
})
export class Products implements OnInit {
  products: Product[] = [];
  cols = ['name', 'category', 'costPrice', 'sellingPrice', 'stock', 'gst', 'actions'];
  showForm = false;
  editId: string | null = null;
  categories = ['Bridal', 'Wedding', 'Festive', 'Casual', 'Daily Wear', 'Office Wear', 'Designer'];

  productForm: FormGroup;

  constructor(private fb: FormBuilder, private productSvc: ProductService, private snack: MatSnackBar) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      hsnCode: ['5007'],
      costPrice: ['', [Validators.required, Validators.min(1)]],
      sellingPrice: ['', [Validators.required, Validators.min(1)]],
      stock: ['', [Validators.required, Validators.min(0)]],
      gstRate: [5],
      description: [''],
      imageUrl: ['']
    });
  }

  ngOnInit(): void { this.load(); }

  load(): void { this.productSvc.getAll().subscribe(p => this.products = p); }

  openForm(): void { this.editId = null; this.productForm.reset({ hsnCode: '5007', gstRate: 5 }); this.showForm = true; }

  editProduct(p: any): void {
    this.editId = p.id;
    this.productForm.patchValue({
      name: p.name, category: p.category, hsnCode: p.hsnCode,
      costPrice: p.costPrice, sellingPrice: p.sellingPrice, stock: p.stock,
      gstRate: p.gstRate, description: p.description || '', imageUrl: p.imageUrl || ''
    });
    this.showForm = true;
  }

  saveProduct(): void {
    const v = this.productForm.value;
    const data = { name: v.name, category: v.category, hsnCode: v.hsnCode, costPrice: v.costPrice, sellingPrice: v.sellingPrice, stock: v.stock, gstRate: v.gstRate, description: v.description, imageUrl: v.imageUrl };
    const obs = this.editId ? this.productSvc.update(this.editId, data) : this.productSvc.create(data);
    obs.subscribe({ next: () => { this.snack.open('Saved!', 'OK', { duration: 2000 }); this.load(); this.cancelForm(); }, error: () => this.snack.open('Error saving', 'Close', { duration: 2000 }) });
  }

  deleteProduct(id: string): void {
    if (confirm('Delete this product?')) {
      this.productSvc.delete(id).subscribe(() => { this.snack.open('Deleted', 'OK', { duration: 2000 }); this.load(); });
    }
  }

  cancelForm(): void { this.showForm = false; this.editId = null; }
}
