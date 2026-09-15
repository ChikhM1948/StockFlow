export type Role = 'SUPER_ADMIN' | 'BRAND_ADMIN' | 'DISTRIBUTOR';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  brand: string | null;
  isActive: boolean;
}

export interface Brand {
  _id: string;
  name: string;
  logoUrl: string | null;
  theme: { primaryColor: string; secondaryColor: string };
  invoiceFooter: {
    addressLine: string;
    phone: string;
    email: string;
    taxId: string;
    customText: string;
  };
  status: 'PENDING' | 'TRIAL' | 'ACTIVE' | 'SUSPENDED';
  trialEndsAt: string | null;
}

export interface CustomField {
  key: string;
  value: string;
}

export interface Product {
  _id: string;
  brand: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  lowStockThreshold: number;
  customFields: CustomField[];
  isActive: boolean;
}

export interface DistributorStockItem {
  _id: string;
  product: string;
  productName: string;
  unit: string;
  quantity: number;
  lastUnitPrice: number;
  lowStockThreshold: number;
}

export interface LowStockDistributorStockItem extends DistributorStockItem {
  distributor: { _id: string; name: string; email: string };
}

export interface DispatchItem {
  product: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

export interface DispatchDoc {
  _id: string;
  dispatchNumber: string;
  distributor: { _id: string; name: string; email: string } | string;
  items: DispatchItem[];
  totalAmount: number;
  date: string;
}

export type CustomerType = 'EPICERIE' | 'GROSSISTE' | 'PARTICULIER' | 'AUTRE';

export interface SaleItem {
  product: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface SalePayment {
  amount: number;
  date: string;
  note: string;
  recordedBy?: string;
}

export interface SaleDoc {
  _id: string;
  saleNumber: string;
  distributor: { _id: string; name: string; email: string } | string;
  customerId?: string;
  customer: { name: string; type: CustomerType; phone: string; address: string };
  items: SaleItem[];
  totalAmount: number;
  paymentStatus: 'PAID' | 'UNPAID' | 'PARTIAL';
  amountPaid: number;
  payments: SalePayment[];
  date: string;
}

export interface Customer {
  _id: string;
  brand: string;
  name: string;
  type: CustomerType;
  phone: string;
  address: string;
}

export interface CustomerSummary {
  customer: Customer;
  salesCount: number;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  lastSaleDate: string | null;
}

export interface CustomerDetail {
  customer: Customer;
  sales: SaleDoc[];
  balance: { totalAmount: number; amountPaid: number; balance: number };
}

export type ReturnReason = 'UNSOLD' | 'DAMAGED' | 'OTHER';

export interface ReturnItem {
  product: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

export interface ReturnDoc {
  _id: string;
  returnNumber: string;
  distributor: { _id: string; name: string; email: string } | string;
  items: ReturnItem[];
  totalAmount: number;
  reason: ReturnReason;
  note: string;
  date: string;
}

export type ExpenseCategory = 'LOYER' | 'SALAIRE' | 'CARBURANT' | 'FOURNITURES' | 'AUTRE';

export interface ExpenseDoc {
  _id: string;
  category: ExpenseCategory;
  label: string;
  amount: number;
  date: string;
  createdBy: string;
}

export interface DashboardBestSeller {
  productId: string;
  name: string;
  unit: string;
  quantity: number;
  revenue: number;
}

export interface DashboardRevenuePoint {
  date: string;
  count: number;
  totalAmount: number;
}

export interface DashboardSummary {
  range: { startDate: string; endDate: string };
  bestSellers: DashboardBestSeller[];
  revenueTrend: DashboardRevenuePoint[];
  stockValuation: { central: number; distributed: number; total: number };
  lowStock: { products: number; distributorStockLines: number };
}

export interface CaisseTotals {
  count: number;
  totalAmount: number;
  amountPaid?: number;
}

export interface CaisseSummary {
  daily: CaisseTotals;
  global: CaisseTotals;
  range?: CaisseTotals;
}

export interface CaisseFilters {
  startDate?: string;
  endDate?: string;
  distributorId?: string;
}

export interface DistributorStockSummary {
  itemsCount: number;
  totalQuantity: number;
  totalValue: number;
}

export interface DistributorOverview {
  distributor: { _id: string; name: string; email: string; phone?: string; isActive: boolean };
  stock: DistributorStockSummary;
  caisse: CaisseSummary;
}

export interface DistributorDetail {
  distributor: { _id: string; name: string; email: string; phone?: string; isActive: boolean };
  stock: DistributorStockItem[];
  recentSales: SaleDoc[];
  caisse: CaisseSummary;
}

export interface AdminTokenDoc {
  _id: string;
  tokenId: string;
  companyName: string;
  status: 'PENDING' | 'USED' | 'REVOKED';
  createdAt: string;
}
