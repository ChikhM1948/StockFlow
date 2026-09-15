import { apiClient } from './client';
import { ReturnDoc, ReturnReason } from './types';

export async function listReturns() {
  const { data } = await apiClient.get<{ returns: ReturnDoc[] }>('/returns');
  return data.returns;
}

export async function createReturn(payload: {
  items: { productId: string; quantity: number }[];
  reason: ReturnReason;
  note?: string;
}) {
  const { data } = await apiClient.post<{ retour: ReturnDoc; pdfPath: string }>('/returns', payload);
  return data.retour;
}

export function returnPdfUrl(returnId: string, baseUrl: string) {
  return `${baseUrl}/returns/${returnId}/pdf`;
}
