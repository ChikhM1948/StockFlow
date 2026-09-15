import { apiClient } from './client';
import { DistributorStockItem } from './types';

export async function listMyStock() {
  const { data } = await apiClient.get<{ stocks: DistributorStockItem[] }>('/distributor-stocks/me');
  return data.stocks;
}
