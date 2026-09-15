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
