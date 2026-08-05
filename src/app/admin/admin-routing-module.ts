import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard',  loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'products',   loadComponent: () => import('./products/products').then(m => m.Products) },
  { path: 'brokers',    loadComponent: () => import('./brokers/brokers').then(m => m.Brokers) },
  { path: 'stock',      loadComponent: () => import('./stock/stock').then(m => m.Stock) },
  { path: 'customers',  loadComponent: () => import('./customers/customers').then(m => m.Customers) },
  { path: 'users',      loadComponent: () => import('./users/users').then(m => m.Users) }
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class AdminRoutingModule {}
