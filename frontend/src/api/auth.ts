import { apiClient } from './client';
import { Brand, User } from './types';

export async function onboard(payload: {
  tokenId: string;
  name: string;
  email: string;
  password: string;
}) {
  const { data } = await apiClient.post<{ authToken: string; user: User; brand: Brand }>(
    '/auth/onboard',
    payload
  );
  return data;
}

export async function startTrial(payload: {
  companyName: string;
  name: string;
  email: string;
  password: string;
}) {
  const { data } = await apiClient.post<{ authToken: string; user: User; brand: Brand }>(
    '/auth/trial',
    payload
  );
  return data;
}

export async function activateSubscription(tokenId: string) {
  const { data } = await apiClient.post<{ message: string; brand: Brand }>('/auth/activate', {
    tokenId,
  });
  return data;
}

export async function login(email: string, password: string) {
  const { data } = await apiClient.post<{ authToken: string; user: User }>('/auth/login', {
    email,
    password,
  });
  return data;
}

export async function me() {
  const { data } = await apiClient.get<{ user: User; brand: Brand | null }>('/auth/me');
  return data;
}

export async function createDistributor(payload: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  const { data } = await apiClient.post<{ user: User }>('/auth/distributors', payload);
  return data.user;
}

export async function listDistributors() {
  const { data } = await apiClient.get<{ distributors: User[] }>('/auth/distributors');
  return data.distributors;
}

export async function updateDistributorPermissions(distributorId: string, canAddStock: boolean) {
  const { data } = await apiClient.patch<{ user: User }>(`/auth/distributors/${distributorId}/permissions`, {
    canAddStock,
  });
  return data.user;
}
