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
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
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

export interface SaleDoc {
  _id: string;
  saleNumber: string;
  distributor: { _id: string; name: string; email: string } | string;
  customer: { name: string; type: CustomerType; phone: string; address: string };
  items: SaleItem[];
  totalAmount: number;
  paymentStatus: 'PAID' | 'UNPAID' | 'PARTIAL';
  date: string;
}

export interface AdminTokenDoc {
  _id: string;
  tokenId: string;
  companyName: string;
  status: 'PENDING' | 'USED' | 'REVOKED';
  createdAt: string;
}
