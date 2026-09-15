import { apiClient } from './client';
import { DistributorStockItem, LowStockDistributorStockItem } from './types';

export async function listMyStock() {
  const { data } = await apiClient.get<{ stocks: DistributorStockItem[] }>('/distributor-stocks/me');
  return data.stocks;
}

export async function listLowStockDistributorStocks() {
  const { data } = await apiClient.get<{ stocks: LowStockDistributorStockItem[] }>('/distributor-stocks/low-stock');
  return data.stocks;
}
