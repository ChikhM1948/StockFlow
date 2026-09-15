import { apiClient } from './client';
import { CustomerType, SaleDoc } from './types';

export async function listSales() {
  const { data } = await apiClient.get<{ sales: SaleDoc[] }>('/sales');
  return data.sales;
}

export async function recordPayment(saleId: string, payload: { amount: number; note?: string }) {
  const { data } = await apiClient.post<{ sale: SaleDoc }>(`/sales/${saleId}/payments`, payload);
  return data.sale;
}

export async function createSale(payload: {
  customer: { name: string; type: CustomerType; phone?: string; address?: string };
  items: { productId: string; quantity: number; unitPrice: number }[];
  paymentStatus?: 'PAID' | 'UNPAID' | 'PARTIAL';
  amountPaid?: number;
}) {
  const { data } = await apiClient.post<{
    sale: SaleDoc;
    invoicePath: string;
    deliveryNotePath: string;
  }>('/sales', payload);
  return data.sale;
}

export function invoicePdfUrl(saleId: string, baseUrl: string) {
  return `${baseUrl}/sales/${saleId}/invoice`;
}

export function deliveryNotePdfUrl(saleId: string, baseUrl: string) {
  return `${baseUrl}/sales/${saleId}/delivery-note`;
}
