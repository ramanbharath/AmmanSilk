import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { CustomerService } from '../../shared/services/customer';
import { Customer } from '../../shared/models/models';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Sidebar,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule, MatToolbarModule],
  template: `
    <div class="app-layout">
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <mat-toolbar color="primary">
          <mat-icon>people</mat-icon>&nbsp;
          <span>Customer Management</span>
          <span class="spacer"></span>
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search by name or mobile</mat-label>
            <input matInput [(ngModel)]="searchTerm" (input)="search()" placeholder="Type to search...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
          <button mat-raised-button (click)="openForm()" style="background:#fff; color:#1a237e; margin-left:8px">
            <mat-icon>add</mat-icon> Add Customer
          </button>
        </mat-toolbar>

        <div class="content-body">
          <!-- Add / Edit Form -->
          <mat-card class="form-card" *ngIf="showForm">
            <mat-card-title>{{ editId ? 'Edit' : 'Add' }} Customer</mat-card-title>
            <mat-card-content>
              <form [formGroup]="customerForm" (ngSubmit)="save()">
                <div class="row-2">
                  <mat-form-field appearance="outline">
                    <mat-label>Full Name *</mat-label>
                    <input matInput formControlName="name">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Mobile * (10 digits)</mat-label>
                    <input matInput formControlName="mobile" maxlength="10">
                    <mat-error *ngIf="customerForm.get('mobile')?.hasError('pattern')">Must be 10 digits</mat-error>
                  </mat-form-field>
                </div>
                <div class="row-2">
                  <mat-form-field appearance="outline">
                    <mat-label>Email</mat-label>
                    <input matInput type="email" formControlName="email">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Address</mat-label>
                    <input matInput formControlName="address">
                  </mat-form-field>
                </div>
                <div class="form-actions">
                  <button mat-raised-button color="primary" type="submit" [disabled]="customerForm.invalid">
                    <mat-icon>save</mat-icon> {{ editId ? 'Update' : 'Save' }}
                  </button>
                  <button mat-stroked-button type="button" (click)="cancelForm()">Cancel</button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>

          <!-- Customer Table -->
          <mat-card>
            <mat-card-title>
              <mat-icon>people</mat-icon>
              {{ customers.length }} Customer(s)
            </mat-card-title>
            <mat-card-content>
              <table mat-table [dataSource]="customers" class="full-table" *ngIf="customers.length > 0; else noData">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let c"><strong>{{ c.name }}</strong></td>
                </ng-container>
                <ng-container matColumnDef="mobile">
                  <th mat-header-cell *matHeaderCellDef>Mobile</th>
                  <td mat-cell *matCellDef="let c">{{ c.mobile }}</td>
                </ng-container>
                <ng-container matColumnDef="email">
                  <th mat-header-cell *matHeaderCellDef>Email</th>
                  <td mat-cell *matCellDef="let c">{{ c.email || '—' }}</td>
                </ng-container>
                <ng-container matColumnDef="address">
                  <th mat-header-cell *matHeaderCellDef>Address</th>
                  <td mat-cell *matCellDef="let c">{{ c.address || '—' }}</td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let c">
                    <button mat-icon-button color="primary" (click)="edit(c)">
                      <mat-icon>edit</mat-icon>
                    </button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="cols"></tr>
                <tr mat-row *matRowDef="let row; columns: cols;"></tr>
              </table>
              <ng-template #noData>
                <div class="no-data">No customers found.</div>
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
    .search-field { --mdc-outlined-text-field-outline-color: rgba(255,255,255,0.5); width: 280px; }
    .content-body { flex: 1; overflow: auto; padding: 16px; background: #f5f5f5; display: flex; flex-direction: column; gap: 12px; }
    .form-card { border-left: 4px solid #1a237e; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 4px; }
    .form-actions { display: flex; gap: 10px; margin-top: 8px; }
    .full-table { width: 100%; }
    .no-data { padding: 32px; text-align: center; color: #888; }
    mat-card-title { display: flex; align-items: center; gap: 6px; font-size: 15px; margin-bottom: 12px; }
    @media (max-width: 700px) { .row-2 { grid-template-columns: 1fr; } }
  `]
})
export class Customers implements OnInit {
  customers: Customer[] = [];
  cols = ['name', 'mobile', 'email', 'address', 'actions'];
  showForm = false;
  editId: string | null = null;
  searchTerm = '';
  customerForm: FormGroup;

  constructor(private fb: FormBuilder, private customerSvc: CustomerService, private snack: MatSnackBar) {
    this.customerForm = this.fb.group({
      name: ['', Validators.required],
      mobile: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: [''],
      address: ['']
    });
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.customerSvc.getAll().subscribe(c => this.customers = c);
  }

  search(): void {
    if (this.searchTerm.trim().length >= 2) {
      this.customerSvc.search(this.searchTerm.trim()).subscribe(c => this.customers = c);
    } else if (!this.searchTerm.trim()) {
      this.load();
    }
  }

  openForm(): void {
    this.editId = null;
    this.customerForm.reset();
    this.showForm = true;
  }

  edit(c: Customer): void {
    this.editId = c.id;
    this.customerForm.patchValue({ name: c.name, mobile: c.mobile, email: c.email || '', address: c.address || '' });
    this.showForm = true;
  }

  save(): void {
    if (this.customerForm.invalid) return;
    const v = this.customerForm.value;
    const obs = this.editId
      ? this.customerSvc.update(this.editId, v)
      : this.customerSvc.create(v);
    obs.subscribe({
      next: () => { this.snack.open('Saved!', 'OK', { duration: 2000 }); this.load(); this.cancelForm(); },
      error: (err) => this.snack.open(err?.error?.message || 'Error saving', 'Close', { duration: 3000 })
    });
  }

  cancelForm(): void { this.showForm = false; this.editId = null; }
}
