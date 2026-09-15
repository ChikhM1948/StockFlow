import { apiClient } from './client';
import { Brand } from './types';

export async function getMyBrand() {
  const { data } = await apiClient.get<{ brand: Brand }>('/brands/me');
  return data.brand;
}

export async function updateMyBrand(payload: Partial<{
  name: string;
  logoUrl: string;
  theme: Partial<Brand['theme']>;
  invoiceFooter: Partial<Brand['invoiceFooter']>;
}>) {
  const { data } = await apiClient.patch<{ brand: Brand }>('/brands/me', payload);
  return data.brand;
}
