import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Customer } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly API = environment.apiUrl;
  constructor(private http: HttpClient) {}

  private mapCustomer(c: any): Customer {
    return {
      id: c.id,
      name: c.name,
      mobile: c.mobile,
      email: c.email,
      address: c.address
    };
  }

  search(term: string): Observable<Customer[]> {
    return this.http.get<any[]>(`${this.API}/customers`, { params: { search: term } })
      .pipe(map(rows => rows.map(c => this.mapCustomer(c))));
  }
  getAll(): Observable<Customer[]> {
    return this.http.get<any[]>(`${this.API}/customers`)
      .pipe(map(rows => rows.map(c => this.mapCustomer(c))));
  }
  create(c: Partial<Customer>): Observable<Customer> {
    return this.http.post<any>(`${this.API}/customers`, c)
      .pipe(map(r => this.mapCustomer(r)));
  }
  update(id: string, c: Partial<Customer>): Observable<Customer> {
    return this.http.put<any>(`${this.API}/customers/${id}`, c)
      .pipe(map(r => this.mapCustomer(r)));
  }
}
