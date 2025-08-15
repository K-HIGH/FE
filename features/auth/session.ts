import { api } from '@/services/apiClient';
import * as SecureStore from 'expo-secure-store';

export async function refreshSessionInServer(access_token: string) {
  const res = await api.post('/api/v1/auth/login', { access_token: access_token });
  if (res.status !== 200 && res.status !== 201) throw new Error('session sync failed');
}

export async function setAccessToken(access_token: string) {
  await SecureStore.setItemAsync('accessToken', access_token);
}
export async function setRefreshToken(refresh_token: string) {
  await SecureStore.setItemAsync('refreshToken', refresh_token);
}

export async function getServerAccessToken() {
  return SecureStore.getItemAsync('accessToken');
}
export async function getServerRefreshToken() {
  return SecureStore.getItemAsync('refreshToken');
}
export async function clearAccessToken() {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
}
