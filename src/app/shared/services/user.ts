import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly API = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API}/users`);
  }
  create(u: { name: string; username: string; password: string; role: string }): Observable<User> {
    return this.http.post<User>(`${this.API}/users`, u);
  }
  update(id: string, u: Partial<{ name: string; role: string; active: boolean }>): Observable<User> {
    return this.http.put<User>(`${this.API}/users/${id}`, u);
  }
  resetPassword(id: string, password: string): Observable<any> {
    return this.http.put(`${this.API}/users/${id}/password`, { password });
  }
}
