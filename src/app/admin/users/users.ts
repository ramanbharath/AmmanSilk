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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { UserService } from '../../shared/services/user';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Sidebar,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSnackBarModule, MatToolbarModule, MatTooltipModule],
  template: `
    <div class="app-layout">
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <mat-toolbar color="primary">
          <mat-icon>manage_accounts</mat-icon>&nbsp;
          <span>User Management</span>
          <span class="spacer"></span>
          <button mat-raised-button (click)="openForm()" style="background:#fff; color:#1a237e">
            <mat-icon>person_add</mat-icon> Add User
          </button>
        </mat-toolbar>

        <div class="content-body">
          <!-- Add Form -->
          <mat-card class="form-card" *ngIf="showAddForm">
            <mat-card-title>Add New User</mat-card-title>
            <mat-card-content>
              <form [formGroup]="addForm" (ngSubmit)="saveUser()">
                <div class="row-4">
                  <mat-form-field appearance="outline">
                    <mat-label>Full Name *</mat-label>
                    <input matInput formControlName="name">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Username *</mat-label>
                    <input matInput formControlName="username">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Password *</mat-label>
                    <input matInput type="password" formControlName="password">
                    <mat-hint>Min 6 characters</mat-hint>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Role *</mat-label>
                    <mat-select formControlName="role">
                      <mat-option value="STAFF">Staff</mat-option>
                      <mat-option value="ADMIN">Admin</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
                <div class="form-actions">
                  <button mat-raised-button color="primary" type="submit" [disabled]="addForm.invalid">
                    <mat-icon>save</mat-icon> Create User
                  </button>
                  <button mat-stroked-button type="button" (click)="cancelForm()">Cancel</button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>

          <!-- Reset Password Panel -->
          <mat-card class="form-card" *ngIf="resetId">
            <mat-card-title>Reset Password for {{ resetName }}</mat-card-title>
            <mat-card-content>
              <form [formGroup]="resetForm" (ngSubmit)="doReset()">
                <div class="row-2">
                  <mat-form-field appearance="outline">
                    <mat-label>New Password *</mat-label>
                    <input matInput type="password" formControlName="password">
                    <mat-hint>Min 6 characters</mat-hint>
                  </mat-form-field>
                </div>
                <div class="form-actions">
                  <button mat-raised-button color="primary" type="submit" [disabled]="resetForm.invalid">
                    <mat-icon>lock_reset</mat-icon> Set Password
                  </button>
                  <button mat-stroked-button type="button" (click)="cancelReset()">Cancel</button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>

          <!-- Users Table -->
          <mat-card>
            <mat-card-title><mat-icon>group</mat-icon> {{ users.length }} User(s)</mat-card-title>
            <mat-card-content>
              <table mat-table [dataSource]="users" class="full-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let u"><strong>{{ u.name }}</strong></td>
                </ng-container>
                <ng-container matColumnDef="username">
                  <th mat-header-cell *matHeaderCellDef>Username</th>
                  <td mat-cell *matCellDef="let u"><code>{{ u.username }}</code></td>
                </ng-container>
                <ng-container matColumnDef="role">
                  <th mat-header-cell *matHeaderCellDef>Role</th>
                  <td mat-cell *matCellDef="let u">
                    <span [class.badge-admin]="u.role === 'ADMIN'" [class.badge-staff]="u.role === 'STAFF'">
                      {{ u.role }}
                    </span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="active">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let u">
                    <span [class.active-yes]="u.active" [class.active-no]="!u.active">
                      {{ u.active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let u">
                    <button mat-icon-button color="warn" (click)="toggleActive(u)"
                            matTooltip="{{ u.active ? 'Deactivate' : 'Activate' }}">
                      <mat-icon>{{ u.active ? 'toggle_on' : 'toggle_off' }}</mat-icon>
                    </button>
                    <button mat-icon-button color="primary" (click)="startReset(u)"
                            matTooltip="Reset Password">
                      <mat-icon>lock_reset</mat-icon>
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
    .row-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-actions { display: flex; gap: 10px; margin-top: 8px; }
    .full-table { width: 100%; }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-size: 12px; }
    mat-card-title { display: flex; align-items: center; gap: 6px; font-size: 15px; margin-bottom: 12px; }
    .badge-admin { background: #1a237e; color: #fff; padding: 2px 9px; border-radius: 10px; font-size: 12px; }
    .badge-staff { background: #e8eaf6; color: #1a237e; padding: 2px 9px; border-radius: 10px; font-size: 12px; }
    .active-yes { color: #2e7d32; font-weight: 600; }
    .active-no  { color: #c62828; font-weight: 600; }
    @media (max-width: 900px) { .row-4 { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 600px) { .row-4, .row-2 { grid-template-columns: 1fr; } }
  `]
})
export class Users implements OnInit {
  users: any[] = [];
  cols = ['name', 'username', 'role', 'active', 'actions'];
  showAddForm = false;
  resetId: string | null = null;
  resetName = '';
  addForm: FormGroup;
  resetForm: FormGroup;

  constructor(private fb: FormBuilder, private userSvc: UserService, private snack: MatSnackBar) {
    this.addForm = this.fb.group({
      name: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['STAFF', Validators.required]
    });
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void { this.load(); }
  load(): void { this.userSvc.getAll().subscribe(u => this.users = u); }

  openForm(): void { this.addForm.reset({ role: 'STAFF' }); this.showAddForm = true; }
  cancelForm(): void { this.showAddForm = false; }

  saveUser(): void {
    if (this.addForm.invalid) return;
    this.userSvc.create(this.addForm.value).subscribe({
      next: () => { this.snack.open('User created!', 'OK', { duration: 2000 }); this.load(); this.cancelForm(); },
      error: (err) => this.snack.open(err?.error?.message || 'Error creating user', 'Close', { duration: 3000 })
    });
  }

  toggleActive(u: any): void {
    this.userSvc.update(u.id, { active: !u.active }).subscribe({
      next: () => { this.snack.open(`User ${u.active ? 'deactivated' : 'activated'}`, 'OK', { duration: 2000 }); this.load(); },
      error: () => this.snack.open('Error updating user', 'Close', { duration: 2000 })
    });
  }

  startReset(u: any): void { this.resetId = u.id; this.resetName = u.name; this.resetForm.reset(); }
  cancelReset(): void { this.resetId = null; this.resetName = ''; }

  doReset(): void {
    if (!this.resetId || this.resetForm.invalid) return;
    this.userSvc.resetPassword(this.resetId, this.resetForm.value.password).subscribe({
      next: () => { this.snack.open('Password reset!', 'OK', { duration: 2000 }); this.cancelReset(); },
      error: () => this.snack.open('Error resetting password', 'Close', { duration: 2000 })
    });
  }
}
