
import { supabase } from '@/services/supabaseClient';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as QueryString from 'query-string';

// 앱 시작 시 1회 호출 필요(아래 _layout에서 호출)
WebBrowser.maybeCompleteAuthSession();

const REDIRECT = Linking.createURL('auth-callback'); 
// 결과: recipeit://auth-callback

export async function signInWithOAuth(provider: 'google' | 'kakao') {
  // 1) Supabase에서 OAuth URL만 받아옴
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: REDIRECT,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;

  // 2) 시스템 브라우저로 열고, 우리 스킴으로 돌아오면 URL을 줌
  const res = await WebBrowser.openAuthSessionAsync(data!.url, REDIRECT);
  if (res.type === 'success' && res.url) {
    await handleRedirect(res.url);
  } else {
    console.log('[OAuth] signInWithProvider error', res);
  }
}

// 브라우저에서 돌아온 URL을 세션으로 교환/세팅
export async function handleRedirect(url: string) {
  const parsedUrl = new URL(url);         // react-native-url-polyfill 필요
  const hash = parsedUrl.hash.substring(1); // '#' 제거
  const params = QueryString.parse(hash);
  // console.log('[OAuth] handleRedirect', url);
  // console.log('[OAuth] handleRedirect', params);

  const access_token = (params.access_token as string);
  const refresh_token = (params.refresh_token as string);
  const code = (params.code as string);

  if (access_token) {
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) throw error;
    return;
  }

  // TODO: OAuth 로그인 시 코드 받아오는 경우 추가
  // if (code) {
  //   const { error } = await supabase.auth.exchangeCodeForSession(code);
  //   if (error) throw error;
  //   return;
  // }

  throw new Error('No token or code in redirect URL');
}

export async function signOut() {
  await supabase.auth.signOut();
}