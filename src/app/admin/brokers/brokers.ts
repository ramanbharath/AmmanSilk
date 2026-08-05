import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { BrokerService } from '../../shared/services/broker';
import { Broker } from '../../shared/models/models';

@Component({
  selector: 'app-brokers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Sidebar,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSlideToggleModule, MatSnackBarModule, MatToolbarModule],
  template: `
    <div class="app-layout">
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <mat-toolbar color="primary">
          <mat-icon>group</mat-icon>&nbsp;
          <span>Broker Management</span>
          <span class="spacer"></span>
          <button mat-raised-button (click)="openForm()" style="background:#fff; color:#1a237e">
            <mat-icon>add</mat-icon> Add Broker
          </button>
        </mat-toolbar>

        <div class="content-body">
          <mat-card class="form-card" *ngIf="showForm">
            <mat-card-title>{{ editId ? 'Edit' : 'Add' }} Broker</mat-card-title>
            <mat-card-content>
              <form [formGroup]="brokerForm" (ngSubmit)="saveBroker()">
                <div class="row-3">
                  <mat-form-field appearance="outline">
                    <mat-label>Broker Name *</mat-label>
                    <input matInput formControlName="name">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Mobile *</mat-label>
                    <input matInput formControlName="mobile">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Default Discount %</mat-label>
                    <input matInput type="number" min="0" max="100" formControlName="defaultDiscountPct">
                  </mat-form-field>
                </div>
                <div class="form-actions">
                  <button mat-raised-button color="primary" type="submit" [disabled]="brokerForm.invalid">
                    <mat-icon>save</mat-icon> {{ editId ? 'Update' : 'Save' }}
                  </button>
                  <button mat-stroked-button type="button" (click)="cancelForm()">Cancel</button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-content>
              <table mat-table [dataSource]="brokers" class="full-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let b"><strong>{{ b.name }}</strong></td>
                </ng-container>
                <ng-container matColumnDef="mobile">
                  <th mat-header-cell *matHeaderCellDef>Mobile</th>
                  <td mat-cell *matCellDef="let b">{{ b.mobile }}</td>
                </ng-container>
                <ng-container matColumnDef="discount">
                  <th mat-header-cell *matHeaderCellDef>Default Discount</th>
                  <td mat-cell *matCellDef="let b"><strong>{{ b.defaultDiscountPct }}%</strong></td>
                </ng-container>
                <ng-container matColumnDef="active">
                  <th mat-header-cell *matHeaderCellDef>Active</th>
                  <td mat-cell *matCellDef="let b">
                    <span [class.active-yes]="b.active" [class.active-no]="!b.active">
                      {{ b.active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let b">
                    <button mat-icon-button color="primary" (click)="editBroker(b)"><mat-icon>edit</mat-icon></button>
                    <button mat-icon-button color="warn" (click)="toggleActive(b)">
                      <mat-icon>{{ b.active ? 'toggle_on' : 'toggle_off' }}</mat-icon>
                    </button>
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
    .row-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .form-actions { display: flex; gap: 10px; margin-top: 8px; }
    .full-table { width: 100%; }
    .active-yes { color: #2e7d32; font-weight: 600; }
    .active-no  { color: #c62828; font-weight: 600; }
  `]
})
export class Brokers implements OnInit {
  brokers: Broker[] = [];
  cols = ['name', 'mobile', 'discount', 'active', 'actions'];
  showForm = false;
  editId: string | null = null;
  brokerForm: FormGroup;

  constructor(private fb: FormBuilder, private brokerSvc: BrokerService, private snack: MatSnackBar) {
    this.brokerForm = this.fb.group({
      name: ['', Validators.required],
      mobile: ['', Validators.required],
      defaultDiscountPct: [0]
    });
  }

  ngOnInit(): void { this.load(); }
  load(): void { this.brokerSvc.getAll().subscribe(b => this.brokers = b); }

  openForm(): void { this.editId = null; this.brokerForm.reset({ defaultDiscountPct: 0 }); this.showForm = true; }

  editBroker(b: any): void {
    this.editId = b.id;
    this.brokerForm.patchValue({ name: b.name, mobile: b.mobile, defaultDiscountPct: b.default_discount_pct });
    this.showForm = true;
  }

  saveBroker(): void {
    const v = this.brokerForm.value;
    const obs = this.editId ? this.brokerSvc.update(this.editId, v) : this.brokerSvc.create(v);
    obs.subscribe({ next: () => { this.snack.open('Saved!', 'OK', { duration: 2000 }); this.load(); this.cancelForm(); } });
  }

  toggleActive(b: any): void {
    this.brokerSvc.update(b.id, { ...b, active: !b.active }).subscribe(() => this.load());
  }

  cancelForm(): void { this.showForm = false; this.editId = null; }
}
