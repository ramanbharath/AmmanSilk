import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Broker } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BrokerService {
  private readonly API = environment.apiUrl;
  constructor(private http: HttpClient) {}

  private mapBroker(b: any): Broker {
    return {
      id: b.id,
      name: b.name,
      mobile: b.mobile,
      defaultDiscountPct: parseFloat(b.default_discount_pct ?? b.defaultDiscountPct ?? 0),
      active: b.active
    };
  }

  getAll(): Observable<Broker[]> {
    return this.http.get<any[]>(`${this.API}/brokers`).pipe(map(rows => rows.map(b => this.mapBroker(b))));
  }
  create(b: Partial<Broker>): Observable<Broker> {
    return this.http.post<any>(`${this.API}/brokers`, b).pipe(map(r => this.mapBroker(r)));
  }
  update(id: string, b: Partial<Broker>): Observable<Broker> {
    return this.http.put<any>(`${this.API}/brokers/${id}`, b).pipe(map(r => this.mapBroker(r)));
  }
}
