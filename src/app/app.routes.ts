import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth-guard';
import { adminGuard } from './auth/guards/admin-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then(m => m.Login)
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadChildren: () => import('./admin/admin-routing-module').then(m => m.AdminRoutingModule)
  },
  {
    path: 'billing',
    canActivate: [authGuard],
    loadChildren: () => import('./billing/billing-routing-module').then(m => m.BillingRoutingModule)
  },
  {
    path: 'reports',
    canActivate: [authGuard, adminGuard],
    loadChildren: () => import('./reports/reports-routing-module').then(m => m.ReportsRoutingModule)
  },
  { path: '**', redirectTo: '/login' }
];
