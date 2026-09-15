import { apiClient } from './client';
import { DispatchDoc } from './types';

export async function listDispatches() {
  const { data } = await apiClient.get<{ dispatches: DispatchDoc[] }>('/dispatches');
  return data.dispatches;
}

export async function createDispatch(payload: {
  distributorId: string;
  items: { productId: string; quantity: number }[];
  signatures?: { adminName?: string; distributorName?: string };
}) {
  const { data } = await apiClient.post<{ dispatch: DispatchDoc; pdfPath: string }>(
    '/dispatches',
    payload
  );
  return data.dispatch;
}

export function dispatchPdfUrl(dispatchId: string, baseUrl: string) {
  return `${baseUrl}/dispatches/${dispatchId}/pdf`;
}
