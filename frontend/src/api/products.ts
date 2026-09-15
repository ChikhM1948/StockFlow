import { apiClient } from './client';
import { CustomField, Product } from './types';

export async function listProducts() {
  const { data } = await apiClient.get<{ products: Product[] }>('/products');
  return data.products;
}

export async function createProduct(payload: {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  lowStockThreshold?: number;
  customFields: CustomField[];
}) {
  const { data } = await apiClient.post<{ product: Product }>('/products', payload);
  return data.product;
}

export async function listLowStockProducts() {
  const { data } = await apiClient.get<{ products: Product[] }>('/products/low-stock');
  return data.products;
}

export async function updateLowStockThreshold(productId: string, lowStockThreshold: number) {
  const { data } = await apiClient.patch<{ product: Product }>(`/products/${productId}/threshold`, {
    lowStockThreshold,
  });
  return data.product;
}
