import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import 'react-native-get-random-values'; // WebCrypto polyfill for PKCE SHA256 support
import 'react-native-url-polyfill/auto';

/**
 * Expo SecureStore를 사용한 Supabase 인증 스토리지 어댑터
 * 사용자 세션을 안전하게 저장하고 관리
 */
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

// 환경 변수에서 Supabase 설정 가져오기
const { SUPABASE_URL, SUPABASE_ANON_KEY } = Constants.expoConfig?.extra ?? {};
const supabaseUrl = SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// 환경 변수 검증
if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.warn(
    '⚠️ Supabase 환경 변수가 설정되지 않았습니다.\n' +
    '.env 파일에 다음 변수들을 설정해주세요:\n' +
    '- EXPO_PUBLIC_SUPABASE_URL\n' +
    '- EXPO_PUBLIC_SUPABASE_ANON_KEY'
  );
}

/**
 * Supabase 클라이언트 인스턴스
 * OAuth 인증과 사용자 데이터 관리를 위한 설정 포함
 * WebCrypto polyfill을 통해 PKCE SHA256 지원
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // flowType: 'pkce', // OAuth 보안을 위한 PKCE 플로우 사용 (SHA256 지원)
    flowType: 'implicit',
  },
}); 