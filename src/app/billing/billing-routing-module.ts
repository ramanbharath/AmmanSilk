import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'pos', pathMatch: 'full' },
  { path: 'pos',     loadComponent: () => import('./pos/pos').then(m => m.Pos) },
  { path: 'invoice/:id', loadComponent: () => import('./invoice-preview/invoice-preview').then(m => m.InvoicePreview) }
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class BillingRoutingModule {}
