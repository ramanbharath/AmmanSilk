import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly API = environment.apiUrl;
  constructor(private http: HttpClient) {}

  private mapProduct(p: any): Product {
    return {
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description,
      costPrice: parseFloat(p.cost_price ?? p.costPrice),
      sellingPrice: parseFloat(p.selling_price ?? p.sellingPrice),
      stock: p.stock,
      hsnCode: p.hsn_code ?? p.hsnCode ?? '5007',
      gstRate: parseFloat(p.gst_rate ?? p.gstRate ?? 5),
      imageUrl: p.image_url ?? p.imageUrl
    };
  }

  getAll(): Observable<Product[]> {
    return this.http.get<any[]>(`${this.API}/products`).pipe(map(rows => rows.map(p => this.mapProduct(p))));
  }
  create(p: Partial<Product>): Observable<Product> {
    return this.http.post<any>(`${this.API}/products`, p).pipe(map(r => this.mapProduct(r)));
  }
  update(id: string, p: Partial<Product>): Observable<Product> {
    return this.http.put<any>(`${this.API}/products/${id}`, p).pipe(map(r => this.mapProduct(r)));
  }
  delete(id: string): Observable<any> {
    return this.http.delete(`${this.API}/products/${id}`);
  }
  getStock(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/stock`);
  }
  updateStock(id: string, stock: number): Observable<any> {
    return this.http.put(`${this.API}/stock/${id}`, { stock });
  }
}
