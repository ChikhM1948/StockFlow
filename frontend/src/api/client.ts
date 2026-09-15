import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

// En dev, remplace par l'IP locale de ta machine (pas "localhost", inatteignable
// depuis un appareil/émulateur physique). Voir .env.example.
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

export const apiClient = axios.create({ baseURL: API_URL });

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function saveAuthToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getAuthToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearAuthToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message || err.message || 'Erreur réseau.';
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Erreur inattendue.';
}
