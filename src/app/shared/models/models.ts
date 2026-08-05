export type UserRole = 'ADMIN' | 'STAFF';
export type PaymentMode = 'CASH' | 'UPI' | 'CARD';
export type DiscountType = 'PERCENT' | 'FLAT';

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  active?: boolean;
  token?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description?: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  hsnCode: string;
  gstRate: number; // 5 or 12
  imageUrl?: string;
  active?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
}

export interface Broker {
  id: string;
  name: string;
  mobile: string;
  defaultDiscountPct: number;
  active: boolean;
}

export interface CartItem {
  product: Product;
  qty: number;
  rate: number;
  amount: number;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  category: string;
  hsnCode: string;
  gstRate: number;
  qty: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id?: string;
  invoiceNumber?: string;
  date: string;
  customer: Customer;
  items: InvoiceItem[];
  subtotal: number;
  customerDiscountType: DiscountType;
  customerDiscountPct: number;
  customerDiscountAmt: number;
  broker?: Broker;
  brokerDiscountType: DiscountType;
  brokerDiscountPct: number;
  brokerDiscountAmt: number;
  taxableAmount: number;
  gstAmount: number;
  netPayable: number;
  paymentMode: PaymentMode;
  cancelled?: boolean;
}

export interface SalesReport {
  period: string;
  totalGross: number;
  totalCustomerDiscount: number;
  totalBrokerDiscount: number;
  totalGst: number;
  netRevenue: number;
  totalBills: number;
}

export interface BrokerReportRow {
  brokerId: string;
  brokerName: string;
  totalBills: number;
  totalSaleValue: number;
  totalBrokerDiscount: number;
  avgDiscountPct: number;
}

export interface CustomerReportRow {
  customerId: string;
  customerName: string;
  mobile: string;
  totalBills: number;
  totalPurchase: number;
  totalCustomerDiscount: number;
}
