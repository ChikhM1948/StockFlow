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
  customFields: CustomField[];
}) {
  const { data } = await apiClient.post<{ product: Product }>('/products', payload);
  return data.product;
}
