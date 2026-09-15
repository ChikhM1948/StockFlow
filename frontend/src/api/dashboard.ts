import { apiClient } from './client';
import { DashboardSummary } from './types';

export async function getDashboardSummary(filters?: { startDate?: string; endDate?: string }) {
  const params = new URLSearchParams();
  if (filters?.startDate) params.set('startDate', filters.startDate);
  if (filters?.endDate) params.set('endDate', filters.endDate);
  const qs = params.toString();
  const { data } = await apiClient.get<DashboardSummary>(`/dashboard/summary${qs ? `?${qs}` : ''}`);
  return data;
}
