import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { AuthService } from '../../auth/services/auth';
import { ProductService } from '../../shared/services/product';
import { CustomerService } from '../../shared/services/customer';
import { BrokerService } from '../../shared/services/broker';
import { BillingService } from '../../shared/services/billing';
import { Product, Customer, Broker, CartItem } from '../../shared/models/models';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, Sidebar,
    MatToolbarModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSelectModule, MatTableModule,
    MatDividerModule, MatAutocompleteModule, MatSnackBarModule,
    MatRadioModule, MatTooltipModule,
    MatDatepickerModule, MatNativeDateModule
  ],
  template: `
    <div class="app-layout">
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <mat-toolbar color="primary">
          <mat-icon>point_of_sale</mat-icon>&nbsp;
          <span>New Bill — AmmanSilks</span>
        </mat-toolbar>

        <div class="pos-body">
          <!-- Left: Product Search + Cart -->
          <div class="left-panel">
            <!-- Customer Section -->
            <mat-card class="section-card">
              <mat-card-title><mat-icon>person</mat-icon> Customer Details</mat-card-title>
              <mat-card-content>
                <!-- Bill Date row -->
                <div class="row-2">
                  <mat-form-field appearance="outline" class="flex-1">
                    <mat-label>Bill Date</mat-label>
                    <input matInput [matDatepicker]="billPicker" [(ngModel)]="billDate" placeholder="DD/MM/YYYY" readonly>
                    <mat-datepicker-toggle matSuffix [for]="billPicker"></mat-datepicker-toggle>
                    <mat-datepicker #billPicker></mat-datepicker>
                  </mat-form-field>
                  <div class="flex-1"></div>
                </div>
                <div class="row-2">
                  <mat-form-field appearance="outline" class="flex-1">
                    <mat-label>Customer Name *</mat-label>
                    <input matInput [(ngModel)]="customer.name" placeholder="Enter name"
                           autocomplete="off">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="flex-1">
                    <mat-label>Mobile * (10 digits)</mat-label>
                    <input matInput [(ngModel)]="customer.mobile" placeholder="10-digit mobile"
                           maxlength="10" autocomplete="off" (blur)="lookupCustomer()">
                    <mat-hint *ngIf="customer.mobile && customer.mobile.length !== 10" class="warn-hint">
                      Must be exactly 10 digits
                    </mat-hint>
                  </mat-form-field>
                </div>
                <div class="row-2">
                  <mat-form-field appearance="outline" class="flex-1">
                    <mat-label>Email (optional)</mat-label>
                    <input matInput type="email" [(ngModel)]="customer.email"
                           placeholder="customer@email.com" autocomplete="off">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="flex-1">
                    <mat-label>Address (optional)</mat-label>
                    <input matInput [(ngModel)]="customer.address" autocomplete="off">
                  </mat-form-field>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Product Search -->
            <mat-card class="section-card">
              <mat-card-title><mat-icon>search</mat-icon> Add Products</mat-card-title>
              <mat-card-content>
                <div class="row-2">
                  <mat-form-field appearance="outline" class="flex-2">
                    <mat-label>Search Saree</mat-label>
                    <input matInput [(ngModel)]="productSearch" (input)="filterProducts()"
                           placeholder="Type saree name...">
                    <mat-icon matSuffix>search</mat-icon>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="flex-1">
                    <mat-label>Qty</mat-label>
                    <input matInput type="number" min="1" [(ngModel)]="addQty">
                  </mat-form-field>
                </div>
                <!-- Product List -->
                <div class="product-list" *ngIf="filteredProducts.length > 0">
                  <div class="product-item" *ngFor="let p of filteredProducts"
                       (click)="addToCart(p)">
                    <div class="product-info">
                      <strong>{{ p.name }}</strong>
                      <span class="cat-badge">{{ p.category }}</span>
                    </div>
                    <div class="product-meta">
                      <span class="price">₹{{ p.sellingPrice | number }}</span>
                      <span class="stock" [class.low]="p.stock <= 3">Stock: {{ p.stock }}</span>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Cart Table -->
            <mat-card class="section-card" *ngIf="cart.length > 0">
              <mat-card-title><mat-icon>shopping_cart</mat-icon> Cart ({{ cart.length }} items)</mat-card-title>
              <mat-card-content>
                <table mat-table [dataSource]="cart" class="cart-table">
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>Product</th>
                    <td mat-cell *matCellDef="let item">
                      <strong>{{ item.product.name }}</strong><br>
                      <small>{{ item.product.category }}</small>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="qty">
                    <th mat-header-cell *matHeaderCellDef>Qty</th>
                    <td mat-cell *matCellDef="let item">
                      <div class="qty-control">
                        <button mat-icon-button (click)="changeQty(item,-1)"><mat-icon>remove</mat-icon></button>
                        <span>{{ item.qty }}</span>
                        <button mat-icon-button (click)="changeQty(item,1)"><mat-icon>add</mat-icon></button>
                      </div>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="rate">
                    <th mat-header-cell *matHeaderCellDef>Rate (₹)</th>
                    <td mat-cell *matCellDef="let item">
                      <input class="rate-input" type="number" min="0"
                             [(ngModel)]="item.rate"
                             (input)="changeRate(item)"
                             (blur)="changeRate(item)">
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="amount">
                    <th mat-header-cell *matHeaderCellDef>Amount (₹)</th>
                    <td mat-cell *matCellDef="let item"><strong>₹{{ item.amount | number:'1.2-2' }}</strong></td>
                  </ng-container>
                  <ng-container matColumnDef="remove">
                    <th mat-header-cell *matHeaderCellDef></th>
                    <td mat-cell *matCellDef="let item">
                      <button mat-icon-button color="warn" (click)="removeFromCart(item)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="cartColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: cartColumns;"></tr>
                </table>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Right: Billing Summary -->
          <div class="right-panel">
            <mat-card class="billing-summary">
              <mat-card-title><mat-icon>receipt</mat-icon> Bill Summary</mat-card-title>
              <mat-card-content>
                <!-- Subtotal -->
                <div class="summary-row">
                  <span>Subtotal</span>
                  <strong>₹{{ subtotal | number:'1.2-2' }}</strong>
                </div>
                <mat-divider></mat-divider>

                <!-- Customer Discount -->
                <div class="discount-section">
                  <div class="discount-label">
                    <mat-icon class="disc-icon cust">local_offer</mat-icon>
                    Customer Discount
                  </div>
                  <div class="discount-controls">
                    <mat-radio-group [(ngModel)]="customerDiscType" (change)="recalculate()">
                      <mat-radio-button value="PERCENT">%</mat-radio-button>
                      <mat-radio-button value="FLAT">₹</mat-radio-button>
                    </mat-radio-group>
                    <mat-form-field appearance="outline" class="disc-field">
                      <input matInput type="number" min="0"
                             [(ngModel)]="customerDiscValue"
                             (input)="recalculate()"
                             [placeholder]="customerDiscType === 'PERCENT' ? '0-100%' : '₹ amount'">
                    </mat-form-field>
                  </div>
                  <div class="summary-row disc-row cust-disc" *ngIf="customerDiscAmt > 0">
                    <span>Customer Discount</span>
                    <span class="disc-amt">- ₹{{ customerDiscAmt | number:'1.2-2' }}</span>
                  </div>
                </div>

                <!-- Broker Discount — ADMIN ONLY -->
                <div class="discount-section broker-section" *ngIf="auth.isAdmin">
                  <div class="discount-label admin-label">
                    <mat-icon class="disc-icon broker">people</mat-icon>
                    Broker Discount
                    <span class="admin-badge">ADMIN ONLY</span>
                  </div>
                  <mat-form-field appearance="outline" class="full-width" style="margin-top:8px">
                    <mat-label>Select Broker (optional)</mat-label>
                    <mat-select [(ngModel)]="selectedBroker" (selectionChange)="onBrokerChange()">
                      <mat-option [value]="null">-- None --</mat-option>
                      <mat-option *ngFor="let b of brokers" [value]="b">
                        {{ b.name }} (default {{ b.defaultDiscountPct }}%)
                      </mat-option>
                    </mat-select>
                  </mat-form-field>
                  <div class="discount-controls" *ngIf="selectedBroker">
                    <mat-radio-group [(ngModel)]="brokerDiscType" (change)="recalculate()">
                      <mat-radio-button value="PERCENT">%</mat-radio-button>
                      <mat-radio-button value="FLAT">₹</mat-radio-button>
                    </mat-radio-group>
                    <mat-form-field appearance="outline" class="disc-field">
                      <input matInput type="number" min="0"
                             [(ngModel)]="brokerDiscValue"
                             (input)="recalculate()"
                             [placeholder]="brokerDiscType === 'PERCENT' ? '0-100%' : '₹ amount'">
                    </mat-form-field>
                  </div>
                  <div class="summary-row disc-row broker-disc" *ngIf="brokerDiscAmt > 0">
                    <span>Broker Discount ({{ selectedBroker?.name }})</span>
                    <span class="disc-amt broker-color">- ₹{{ brokerDiscAmt | number:'1.2-2' }}</span>
                  </div>
                </div>

                <mat-divider></mat-divider>

                <!-- GST -->
                <div class="summary-row">
                  <span>Taxable Amount</span>
                  <span>₹{{ taxableAmount | number:'1.2-2' }}</span>
                </div>
                <div class="summary-row">
                  <mat-form-field appearance="outline" style="width:100px">
                    <mat-label>GST %</mat-label>
                    <mat-select [(ngModel)]="gstRate" (selectionChange)="recalculate()">
                      <mat-option [value]="0">0%</mat-option>
                      <mat-option [value]="5">5%</mat-option>
                      <mat-option [value]="12">12%</mat-option>
                    </mat-select>
                  </mat-form-field>
                  <span>₹{{ gstAmount | number:'1.2-2' }}</span>
                </div>

                <mat-divider></mat-divider>
                <div class="summary-row net-payable">
                  <strong>NET PAYABLE</strong>
                  <strong class="net-amt">₹{{ netPayable | number:'1.2-2' }}</strong>
                </div>

                <!-- Payment Mode -->
                <mat-form-field appearance="outline" class="full-width" style="margin-top:12px">
                  <mat-label>Payment Mode</mat-label>
                  <mat-select [(ngModel)]="paymentMode">
                    <mat-option value="CASH">Cash</mat-option>
                    <mat-option value="UPI">UPI</mat-option>
                    <mat-option value="CARD">Card</mat-option>
                  </mat-select>
                </mat-form-field>

                <!-- Save Bill Button -->
                <button mat-raised-button color="primary" class="full-width save-btn"
                        (click)="saveBill()" [disabled]="saving || cart.length === 0 || !customer.name || !isMobileValid()">
                  <mat-icon>save</mat-icon> Save & Generate Invoice
                </button>
                <button mat-stroked-button color="warn" class="full-width" style="margin-top:8px"
                        (click)="clearAll()">
                  <mat-icon>clear</mat-icon> Clear All
                </button>
              </mat-card-content>
            </mat-card>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .app-layout { display: flex; height: 100vh; overflow: hidden; }
    .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    mat-toolbar { flex-shrink: 0; }
    .spacer { flex: 1; }
    .date-label { font-size: 13px; opacity: 0.85; }
    .date-field { --mdc-outlined-text-field-outline-color: rgba(255,255,255,0.5); width: 160px; }
    .warn-hint { color: #f44336 !important; font-size: 11px; }
    .pos-body { display: flex; gap: 16px; padding: 16px; overflow: auto; flex: 1; background: #f5f5f5; }
    .left-panel { flex: 2; display: flex; flex-direction: column; gap: 12px; }
    .right-panel { flex: 1; min-width: 320px; }
    @media (max-width: 900px) {
      .pos-body { flex-direction: column; }
      .left-panel, .right-panel { flex: unset; min-width: unset; width: 100%; }
    }
    .section-card { border-radius: 8px; }
    mat-card-title { display: flex; align-items: center; gap: 6px; font-size: 15px; margin-bottom: 12px; }
    .row-2 { display: flex; gap: 12px; }
    .flex-1 { flex: 1; }
    .flex-2 { flex: 2; }
    .full-width { width: 100%; }

    /* Product list */
    .product-list { max-height: 220px; overflow-y: auto; border: 1px solid #e0e0e0; border-radius: 6px; }
    .product-item { display: flex; justify-content: space-between; align-items: center;
                   padding: 10px 12px; cursor: pointer; border-bottom: 1px solid #f0f0f0; }
    .product-item:hover { background: #e3f2fd; }
    .product-info { display: flex; flex-direction: column; gap: 2px; }
    .cat-badge { font-size: 11px; background: #ede7f6; color: #512da8; padding: 1px 6px; border-radius: 10px; display: inline-block; }
    .product-meta { text-align: right; }
    .price { font-weight: 700; color: #1a237e; display: block; }
    .stock { font-size: 11px; color: #666; }
    .stock.low { color: #f44336; font-weight: 600; }

    /* Cart */
    .cart-table { width: 100%; }
    .qty-control { display: flex; align-items: center; gap: 4px; }
    .qty-control span { min-width: 24px; text-align: center; font-weight: 600; }
    .rate-input { width: 90px; padding: 4px 8px; border: 1px solid #bbb; border-radius: 4px; font-size: 14px; text-align: right; outline: none; }
    .rate-input:focus { border-color: #6200ea; box-shadow: 0 0 0 2px rgba(98,0,234,0.15); }

    /* Summary */
    .billing-summary { height: fit-content; border-radius: 8px; position: sticky; top: 0; }
    .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 14px; }
    .disc-row { background: #fff8f8; padding: 4px 8px; border-radius: 4px; margin: 4px 0; }
    .disc-amt { color: #e53935; font-weight: 600; }
    .broker-color { color: #e65100 !important; }
    .net-payable { font-size: 17px; padding: 10px 0; }
    .net-amt { color: #1565c0; font-size: 20px; }

    .discount-section { padding: 8px 0; }
    .broker-section { background: #fff8e1; padding: 10px; border-radius: 6px; margin: 8px 0; border: 1px dashed #f9a825; }
    .discount-label { display: flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 600; margin-bottom: 6px; }
    .admin-label { color: #e65100; }
    .admin-badge { font-size: 10px; background: #e65100; color: #fff; padding: 1px 7px; border-radius: 10px; margin-left: 4px; }
    .disc-icon { font-size: 18px; width: 18px; height: 18px; }
    .disc-icon.cust { color: #e53935; }
    .disc-icon.broker { color: #e65100; }
    .discount-controls { display: flex; align-items: center; gap: 10px; }
    .disc-field { width: 130px; }

    .save-btn { height: 44px; font-size: 15px; margin-top: 4px; }
  `]
})
export class Pos implements OnInit {
  cart: CartItem[] = [];
  cartColumns = ['name', 'qty', 'rate', 'amount', 'remove'];

  customer: any = { name: '', mobile: '', email: '', address: '' };
  products: Product[] = [];
  filteredProducts: Product[] = [];
  productSearch = '';
  addQty = 1;

  brokers: Broker[] = [];
  selectedBroker: Broker | null = null;

  customerDiscType: 'PERCENT' | 'FLAT' = 'PERCENT';
  customerDiscValue = 0;
  customerDiscAmt = 0;

  brokerDiscType: 'PERCENT' | 'FLAT' = 'PERCENT';
  brokerDiscValue = 0;
  brokerDiscAmt = 0;

  gstRate = 5;
  subtotal = 0;
  taxableAmount = 0;
  gstAmount = 0;
  netPayable = 0;
  paymentMode = 'CASH';
  saving = false;
  billDate: Date = new Date();

  constructor(
    public auth: AuthService,
    private productSvc: ProductService,
    private customerSvc: CustomerService,
    private brokerSvc: BrokerService,
    private billingSvc: BillingService,
    private snackbar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.productSvc.getAll().subscribe(p => { this.products = p; this.filteredProducts = p; });
    if (this.auth.isAdmin) {
      this.brokerSvc.getAll().subscribe(b => this.brokers = b);
    }
    // Pre-fill customer fields from the customer record named 'admin'
    this.customerSvc.search('admin').subscribe(results => {
      const adminCustomer = results.find(c => c.name.toLowerCase() === 'admin');
      if (adminCustomer) {
        this.customer.name   = adminCustomer.name;
        this.customer.mobile = adminCustomer.mobile;
        this.customer.email  = adminCustomer.email  || '';
        this.customer.address = adminCustomer.address || '';
      }
    });
  }

  filterProducts(): void {
    const q = this.productSearch.toLowerCase();
    this.filteredProducts = q ? this.products.filter(p =>
      p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    ) : this.products;
  }

  addToCart(product: Product): void {
    const existing = this.cart.find(i => i.product.id === product.id);
    if (existing) {
      existing.qty += this.addQty;
      existing.amount = existing.qty * existing.rate;
    } else {
      this.cart.push({ product, qty: this.addQty, rate: product.sellingPrice, amount: product.sellingPrice * this.addQty });
    }
    this.cart = [...this.cart]; // trigger mat-table change detection
    this.productSearch = '';
    this.filteredProducts = this.products;
    this.recalculate();
  }

  changeQty(item: CartItem, delta: number): void {
    item.qty = Math.max(1, item.qty + delta);
    item.amount = item.qty * item.rate;
    this.cart = [...this.cart]; // trigger mat-table change detection
    this.recalculate();
  }

  changeRate(item: CartItem): void {
    if (!item.rate || item.rate < 0) item.rate = 0;
    item.amount = item.qty * item.rate;
    this.recalculate();
  }

  removeFromCart(item: CartItem): void {
    this.cart = this.cart.filter(i => i !== item);
    this.recalculate();
  }

  isMobileValid(): boolean {
    return /^\d{10}$/.test(this.customer.mobile || '');
  }

  lookupCustomer(): void {
    if (this.isMobileValid()) {
      this.customerSvc.search(this.customer.mobile).subscribe(results => {
        if (results.length > 0) {
          this.customer = { ...results[0] };
          this.snackbar.open(`Customer found: ${results[0].name}`, 'OK', { duration: 2000 });
        }
      });
    }
  }

  onBrokerChange(): void {
    if (this.selectedBroker) {
      this.brokerDiscValue = this.selectedBroker.defaultDiscountPct;
      this.brokerDiscType = 'PERCENT';
    } else {
      this.brokerDiscValue = 0;
      this.brokerDiscAmt = 0;
    }
    this.recalculate();
  }

  recalculate(): void {
    this.subtotal = this.cart.reduce((s, i) => s + i.amount, 0);
    // Customer discount
    this.customerDiscAmt = this.customerDiscType === 'PERCENT'
      ? (this.subtotal * (this.customerDiscValue || 0)) / 100
      : (this.customerDiscValue || 0);
    // Taxable = subtotal - customer discount
    this.taxableAmount = this.subtotal - this.customerDiscAmt;
    // GST on taxable
    this.gstAmount = (this.taxableAmount * this.gstRate) / 100;
    // Broker discount (tracked separately, doesn't affect customer bill)
    this.brokerDiscAmt = this.selectedBroker
      ? (this.brokerDiscType === 'PERCENT'
          ? (this.subtotal * (this.brokerDiscValue || 0)) / 100
          : (this.brokerDiscValue || 0))
      : 0;
    // Net payable = taxable + GST (broker discount does NOT reduce customer's bill)
    this.netPayable = this.taxableAmount + this.gstAmount;
  }

  saveBill(): void {
    if (!this.customer.name || !this.customer.mobile || this.cart.length === 0) return;
    this.saving = true;
    const invoice = {
      date: (() => { const d = this.billDate; return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })(),
      customer: this.customer,
      items: this.cart.map(i => ({
        productId: i.product.id, productName: i.product.name,
        category: i.product.category, hsnCode: i.product.hsnCode,
        gstRate: i.product.gstRate, qty: i.qty, rate: i.rate, amount: i.amount
      })),
      subtotal: this.subtotal,
      customerDiscountType: this.customerDiscType,
      customerDiscountPct: this.customerDiscType === 'PERCENT' ? this.customerDiscValue : 0,
      customerDiscountAmt: this.customerDiscAmt,
      broker: this.selectedBroker ?? undefined,
      brokerDiscountType: this.brokerDiscType,
      brokerDiscountPct: this.brokerDiscType === 'PERCENT' ? this.brokerDiscValue : 0,
      brokerDiscountAmt: this.brokerDiscAmt,
      taxableAmount: this.taxableAmount,
      gstAmount: this.gstAmount,
      netPayable: this.netPayable,
      paymentMode: this.paymentMode as 'CASH' | 'UPI' | 'CARD'
    };
    this.billingSvc.saveInvoice(invoice).subscribe({
      next: (res) => {
        this.saving = false;
        this.snackbar.open(`Bill saved! Invoice: ${res.invoice_number || res.invoiceNumber}`, 'OK', { duration: 3000 });
        this.router.navigate(['/billing/invoice', res.id]);
      },
      error: () => { this.saving = false; this.snackbar.open('Failed to save bill', 'Close', { duration: 3000 }); }
    });
  }

  clearAll(): void {
    this.cart = [];
    this.customer = { name: '', mobile: '', email: '', address: '' };
    // Restore admin customer pre-fill
    this.customerSvc.search('admin').subscribe(results => {
      const adminCustomer = results.find(c => c.name.toLowerCase() === 'admin');
      if (adminCustomer) {
        this.customer.name    = adminCustomer.name;
        this.customer.mobile  = adminCustomer.mobile;
        this.customer.email   = adminCustomer.email  || '';
        this.customer.address = adminCustomer.address || '';
      }
    });
    this.billDate = new Date();
    this.customerDiscValue = 0; this.customerDiscAmt = 0;
    this.brokerDiscValue = 0; this.brokerDiscAmt = 0;
    this.selectedBroker = null;
    this.gstRate = 5;
    this.recalculate();
  }
}
