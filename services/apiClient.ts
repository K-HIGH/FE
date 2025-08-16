import axios from 'axios';
import { supabase } from './supabaseClient';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10_000,
  withCredentials: true, // 서버에서 httpOnly 쿠키 세션(sid)을 내려줄 경우 필요
});

// TODO: 세션 캐싱 전략 필요
api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  });
  
export { api };
