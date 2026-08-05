import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly API = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getSalesReport(from?: string, to?: string): Observable<any> {
    let params: any = {};
    if (from) params['from'] = from;
    if (to)   params['to'] = to;
    return this.http.get<any>(`${this.API}/reports/sales`, { params });
  }
  getBrokerReport(from?: string, to?: string): Observable<any[]> {
    let params: any = {};
    if (from) params['from'] = from;
    if (to)   params['to'] = to;
    return this.http.get<any[]>(`${this.API}/reports/broker`, { params });
  }
  getCustomerReport(from?: string, to?: string): Observable<any[]> {
    let params: any = {};
    if (from) params['from'] = from;
    if (to)   params['to'] = to;
    return this.http.get<any[]>(`${this.API}/reports/customer`, { params });
  }
}
