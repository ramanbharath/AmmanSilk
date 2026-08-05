import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'sales', pathMatch: 'full' },
  { path: 'sales',    loadComponent: () => import('./sales-report/sales-report').then(m => m.SalesReport) },
  { path: 'broker',   loadComponent: () => import('./broker-report/broker-report').then(m => m.BrokerReport) },
  { path: 'customer', loadComponent: () => import('./customer-report/customer-report').then(m => m.CustomerReport) },
  { path: 'invoices', loadComponent: () => import('./invoice-list/invoice-list').then(m => m.InvoiceList) }
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class ReportsRoutingModule {}
