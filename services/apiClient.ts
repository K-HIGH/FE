import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10_000,
  withCredentials: true, // 서버에서 httpOnly 쿠키 세션(sid)을 내려줄 경우 필요
});