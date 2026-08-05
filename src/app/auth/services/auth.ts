import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User } from '../../shared/models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = environment.apiUrl;
  private userSubject = new BehaviorSubject<User | null>(this.loadUser());

  currentUser$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<{ token: string; user: User }> {
    return this.http.post<{ token: string; user: User }>(`${this.API}/auth/login`, { username, password }).pipe(
      tap(res => {
        localStorage.setItem('amman_token', res.token);
        localStorage.setItem('amman_user', JSON.stringify(res.user));
        this.userSubject.next(res.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('amman_token');
    localStorage.removeItem('amman_user');
    this.userSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('amman_token');
  }

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  get isAdmin(): boolean {
    return this.userSubject.value?.role === 'ADMIN';
  }

  get isLoggedIn(): boolean {
    return !!this.userSubject.value;
  }

  private loadUser(): User | null {
    try {
      const u = localStorage.getItem('amman_user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  }
}
