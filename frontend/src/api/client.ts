import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

/**
 * expo-secure-store n'a pas d'implémentation fonctionnelle sur le web
 * (pas de module natif -> "getValueWithKeyAsync is not a function").
 * On retombe sur localStorage pour le web ; en contrepartie le token n'y est
 * pas chiffré au repos, ce qui est un compromis acceptable pour du dev/preview
 * mais à garder en tête si le build web est un jour exposé en production.
 */
const webStorage = {
  async getItemAsync(key: string): Promise<string | null> {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
  },
  async setItemAsync(key: string, value: string): Promise<void> {
    window.localStorage.setItem(key, value);
  },
  async deleteItemAsync(key: string): Promise<void> {
    window.localStorage.removeItem(key);
  },
};

const tokenStorage = Platform.OS === 'web' ? webStorage : SecureStore;

// En dev, remplace par l'IP locale de ta machine (pas "localhost", inatteignable
// depuis un appareil/émulateur physique). Voir .env.example.
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

export const apiClient = axios.create({ baseURL: API_URL });

apiClient.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getItemAsync(TOKEN_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function saveAuthToken(token: string) {
  await tokenStorage.setItemAsync(TOKEN_KEY, token);
}

export async function getAuthToken() {
  return tokenStorage.getItemAsync(TOKEN_KEY);
}

export async function clearAuthToken() {
  await tokenStorage.deleteItemAsync(TOKEN_KEY);
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
