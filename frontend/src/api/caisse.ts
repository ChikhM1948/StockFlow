import { apiClient } from './client';
import { CaisseFilters, CaisseSummary, DistributorDetail, DistributorOverview } from './types';

function toQueryString(filters?: CaisseFilters) {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.distributorId) params.set('distributorId', filters.distributorId);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function getStockCaisse(filters?: CaisseFilters) {
  const { data } = await apiClient.get<{ caisse: CaisseSummary }>(`/caisse/stock${toQueryString(filters)}`);
  return data.caisse;
}

export async function getMyCaisse(filters?: Pick<CaisseFilters, 'startDate' | 'endDate'>) {
  const { data } = await apiClient.get<{ caisse: CaisseSummary }>(`/caisse/me${toQueryString(filters)}`);
  return data.caisse;
}

export async function listDistributorsCaisse(filters?: CaisseFilters) {
  const { data } = await apiClient.get<{ distributors: DistributorOverview[] }>(
    `/caisse/distributors${toQueryString(filters)}`
  );
  return data.distributors;
}

export async function getDistributorDetail(id: string, filters?: Pick<CaisseFilters, 'startDate' | 'endDate'>) {
  const { data } = await apiClient.get<DistributorDetail>(`/caisse/distributors/${id}${toQueryString(filters)}`);
  return data;
}
