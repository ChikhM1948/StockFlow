import { apiClient } from './client';
import { AdminTokenDoc } from './types';

export async function createToken(companyName: string) {
  const { data } = await apiClient.post<{ token: AdminTokenDoc }>('/super-admin/tokens', {
    companyName,
  });
  return data.token;
}

export async function listTokens() {
  const { data } = await apiClient.get<{ tokens: AdminTokenDoc[] }>('/super-admin/tokens');
  return data.tokens;
}
