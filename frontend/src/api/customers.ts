import { apiClient } from './client';
import { CustomerDetail, CustomerSummary } from './types';

export async function listCustomers() {
  const { data } = await apiClient.get<{ customers: CustomerSummary[] }>('/customers');
  return data.customers;
}

export async function getCustomerDetail(id: string) {
  const { data } = await apiClient.get<CustomerDetail>(`/customers/${id}`);
  return data;
}
