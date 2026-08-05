import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BillingService } from '../../shared/services/billing';
import { AuthService } from '../../auth/services/auth';

@Component({
  selector: 'app-invoice-preview',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatDividerModule, MatSnackBarModule],
  template: `
    <div class="page-actions no-print">
      <button mat-raised-button color="primary" (click)="print()"><mat-icon>print</mat-icon> Print Invoice</button>
      <button mat-stroked-button routerLink="/billing/pos"><mat-icon>add</mat-icon> New Bill</button>
      <button mat-stroked-button routerLink="/reports/invoices"><mat-icon>list_alt</mat-icon> Invoice List</button>
      <span class="spacer"></span>
      <button mat-stroked-button color="warn" *ngIf="auth.isAdmin && invoice && !invoice.cancelled"
              (click)="cancelInvoice()">
        <mat-icon>cancel</mat-icon> Void / Cancel Invoice
      </button>
      <div class="cancelled-badge" *ngIf="invoice?.cancelled">CANCELLED</div>
    </div>

    <div class="invoice-container" *ngIf="invoice" id="invoice-print"
         [class.cancelled-invoice]="invoice.cancelled">

      <!-- Cancelled watermark — visible on print too -->
      <div class="cancelled-watermark" *ngIf="invoice.cancelled">CANCELLED</div>

      <!-- Header -->
      <div class="inv-header">
        <div class="shop-details">
          <h1 class="shop-name">AMMAN SILKS</h1>
          <p>Premium Silk Sarees</p>
          <p>GSTIN: 33XXXXX0000X1ZX</p>
          <p>Phone: 99999 99999</p>
        </div>
        <div class="inv-meta">
          <div class="inv-number">INVOICE</div>
          <table class="meta-table">
            <tr><td>Invoice No:</td><td><strong>{{ invoice.invoice_number }}</strong></td></tr>
            <tr><td>Date:</td><td>{{ invoice.date | date:'dd/MM/yyyy' }}</td></tr>
            <tr><td>Payment:</td><td>{{ invoice.payment_mode }}</td></tr>
          </table>
        </div>
      </div>

      <mat-divider></mat-divider>

      <!-- Customer -->
      <div class="customer-section">
        <strong>Bill To:</strong>
        <div>{{ invoice.customer_name }} | {{ invoice.customer_mobile }}</div>
        <div *ngIf="invoice.customer_address">{{ invoice.customer_address }}</div>
      </div>

      <!-- Items Table -->
      <table class="items-table">
        <thead>
          <tr>
            <th>#</th><th>Description</th><th>HSN</th><th>GST%</th>
            <th>Qty</th><th>Rate (₹)</th><th>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of invoice.items; let i = index">
            <td>{{ i+1 }}</td>
            <td>{{ item.product_name }}<br><small>{{ item.category }}</small></td>
            <td>{{ item.hsn_code }}</td>
            <td>{{ item.gst_rate }}%</td>
            <td>{{ item.qty }}</td>
            <td>{{ item.rate | number:'1.2-2' }}</td>
            <td><strong>{{ item.amount | number:'1.2-2' }}</strong></td>
          </tr>
        </tbody>
      </table>

      <!-- Totals -->
      <div class="totals-section">
        <div class="totals-table">
          <div class="total-row"><span>Subtotal</span><span>₹{{ invoice.subtotal | number:'1.2-2' }}</span></div>

          <!-- Customer discount — show label based on type -->
          <div class="total-row discount" *ngIf="+invoice.customer_discount_amt > 0">
            <span *ngIf="invoice.customer_discount_type === 'PERCENT'">
              Customer Discount ({{ invoice.customer_discount_pct }}%)
            </span>
            <span *ngIf="invoice.customer_discount_type === 'FLAT'">
              Customer Discount (Flat ₹{{ invoice.customer_discount_amt | number:'1.2-2' }})
            </span>
            <span class="red">- ₹{{ invoice.customer_discount_amt | number:'1.2-2' }}</span>
          </div>

          <div class="total-row"><span>Taxable Amount</span><span>₹{{ invoice.taxable_amount | number:'1.2-2' }}</span></div>

          <!-- GST: aggregate from items, fall back to invoice-level gst_amount -->
          <div class="total-row">
            <span>GST ({{ effectiveGstLabel }})
            </span>
            <span>₹{{ invoice.gst_amount | number:'1.2-2' }}</span>
          </div>

          <!-- Broker info — ADMIN ONLY, hidden from print output -->
          <div class="total-row broker-row" *ngIf="auth.isAdmin && +invoice.broker_discount_amt > 0"
               style="-webkit-print-color-adjust: exact; print-color-adjust: exact;"
               aria-label="internal broker discount - not for customer">
            <span>Broker: {{ invoice.broker_name }} (Internal — Not on Customer Copy)</span>
            <span class="orange">- ₹{{ invoice.broker_discount_amt | number:'1.2-2' }}</span>
          </div>

          <div class="total-row net-total">
            <strong>NET PAYABLE</strong>
            <strong class="net-val">₹{{ invoice.net_payable | number:'1.2-2' }}</strong>
          </div>
        </div>
      </div>

      <mat-divider></mat-divider>

      <div class="inv-footer">
        <p>Thank you for shopping at Amman Silks!</p>
        <p class="small">This is a computer-generated invoice. No signature required.</p>
        <p class="small">Billed by: {{ invoice.created_by_name }}</p>
      </div>
    </div>
  `,
  styles: [`
    .page-actions { padding: 16px; display: flex; gap: 12px; align-items: center; background: #f5f5f5; flex-wrap: wrap; }
    .spacer { flex: 1; }
    .cancelled-badge { background: #c62828; color: #fff; padding: 4px 14px; border-radius: 4px; font-weight: 700; font-size: 13px; letter-spacing: 1px; }
    .invoice-container { max-width: 800px; margin: 0 auto; padding: 24px; background: #fff; font-family: Arial, sans-serif; font-size: 13px; position: relative; }
    .cancelled-invoice { opacity: 0.65; }
    .cancelled-watermark {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-35deg);
      font-size: 72px; font-weight: 900; color: rgba(198,40,40,0.12);
      pointer-events: none; z-index: 0; letter-spacing: 6px; white-space: nowrap;
    }
    .inv-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .shop-name { font-size: 24px; font-weight: 700; color: #1a237e; margin: 0 0 4px; }
    .shop-details p { margin: 2px 0; color: #444; }
    .inv-number { font-size: 22px; font-weight: 700; color: #880e4f; text-align: right; margin-bottom: 8px; }
    .meta-table td { padding: 2px 8px; }
    .meta-table td:first-child { color: #666; }
    .customer-section { padding: 12px 0; }
    .items-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .items-table th { background: #1a237e; color: #fff; padding: 8px 6px; text-align: left; font-size: 12px; }
    .items-table td { padding: 8px 6px; border-bottom: 1px solid #e0e0e0; }
    .items-table small { color: #888; font-size: 11px; }
    .totals-section { display: flex; justify-content: flex-end; margin: 8px 0; }
    .totals-table { width: 340px; }
    .total-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f0f0f0; }
    .total-row.net-total { border-top: 2px solid #1a237e; padding-top: 8px; margin-top: 4px; font-size: 15px; }
    .net-val { color: #1565c0; font-size: 18px; }
    .red { color: #e53935; }
    .orange { color: #e65100; }
    .broker-row { background: #fff8e1; padding: 4px 6px; border-radius: 4px; }
    .inv-footer { text-align: center; padding: 16px 0; color: #666; }
    .inv-footer p { margin: 4px 0; }
    .small { font-size: 11px; }

    @media print {
      .page-actions { display: none !important; }
      .broker-row { display: none !important; }
      .cancelled-watermark { display: block !important; }
      .invoice-container { padding: 0; }
    }
  `]
})
export class InvoicePreview implements OnInit {
  invoice: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private billingSvc: BillingService,
    private snack: MatSnackBar,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.billingSvc.getInvoice(id).subscribe(inv => this.invoice = inv);
  }

  /** Derive a readable GST label from the line items (e.g. "5%" or "5%, 12%") */
  get effectiveGstLabel(): string {
    if (!this.invoice?.items?.length) return '5%';
    const rates: Set<number> = new Set(this.invoice.items.map((i: any) => +i.gst_rate));
    return Array.from(rates).sort((a,b) => a-b).map(r => `${r}%`).join(', ');
  }

  cancelInvoice(): void {
    if (!confirm('Are you sure you want to VOID this invoice? Stock will be restored.')) return;
    this.billingSvc.cancelInvoice(this.invoice.id).subscribe({
      next: () => {
        this.snack.open('Invoice cancelled. Stock restored.', 'OK', { duration: 3000 });
        this.invoice = { ...this.invoice, cancelled: true };
      },
      error: (err) => this.snack.open(err?.error?.message || 'Failed to cancel invoice', 'Close', { duration: 3000 })
    });
  }

  print(): void { window.print(); }
}
