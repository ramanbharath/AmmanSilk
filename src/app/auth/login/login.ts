import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule,
            MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <div class="logo-area">
            <mat-icon class="logo-icon">diamond</mat-icon>
            <h1>AmmanSilks</h1>
            <p>Billing & Management System</p>
          </div>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onLogin()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Username</mat-label>
              <input matInput formControlName="username" placeholder="admin / staff">
              <mat-icon matSuffix>person</mat-icon>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput [type]="hidePass ? 'password' : 'text'" formControlName="password">
              <button mat-icon-button matSuffix type="button" (click)="hidePass=!hidePass">
                <mat-icon>{{ hidePass ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>
            <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>
            <button mat-raised-button color="primary" class="full-width login-btn"
                    type="submit" [disabled]="loading || loginForm.invalid">
              <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
              <span *ngIf="!loading">Login</span>
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; background: linear-gradient(135deg, #1a237e 0%, #880e4f 100%);
    }
    .login-card { width: 380px; padding: 16px; border-radius: 12px; }
    .logo-area { text-align: center; width: 100%; padding: 16px 0; }
    .logo-icon { font-size: 48px; width: 48px; height: 48px; color: #880e4f; }
    .logo-area h1 { font-size: 28px; font-weight: 700; color: #1a237e; margin: 8px 0 4px; }
    .logo-area p { color: #666; font-size: 13px; }
    .full-width { width: 100%; margin-bottom: 8px; }
    .login-btn { height: 44px; font-size: 16px; margin-top: 8px; }
    .error-msg { color: #f44336; font-size: 13px; margin-bottom: 8px; text-align: center; }
  `]
})
export class Login {
  loginForm: FormGroup;
  loading = false;
  hidePass = true;
  errorMsg = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onLogin(): void {
    if (this.loginForm.invalid) return;
    this.loading = true; this.errorMsg = '';
    const { username, password } = this.loginForm.value;
    this.auth.login(username, password).subscribe({
      next: (res) => {
        this.loading = false;
        this.router.navigate(res.user.role === 'ADMIN' ? ['/admin/dashboard'] : ['/billing/pos']);
      },
      error: () => { this.loading = false; this.errorMsg = 'Invalid username or password'; }
    });
  }
}
