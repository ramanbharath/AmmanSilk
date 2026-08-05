import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Invoice } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly API = environment.apiUrl;
  constructor(private http: HttpClient) {}

  saveInvoice(invoice: Partial<Invoice>): Observable<any> {
    return this.http.post(`${this.API}/invoices`, invoice);
  }
  getInvoices(from?: string, to?: string): Observable<any[]> {
    let params: any = {};
    if (from) params['from'] = from;
    if (to)   params['to'] = to;
    return this.http.get<any[]>(`${this.API}/invoices`, { params });
  }
  getInvoice(id: string): Observable<any> {
    return this.http.get<any>(`${this.API}/invoices/${id}`);
  }
  cancelInvoice(id: string): Observable<any> {
    return this.http.post(`${this.API}/invoices/${id}/cancel`, {});
  }
}
