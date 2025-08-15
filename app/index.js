// app/index.tsx
import { handleRedirect } from '@/features/auth/oauth';
import { supabase } from '@/services/supabaseClient';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';

// 네이티브 스플래시를 자동으로 숨기지 않게
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function Index() {
  const router = useRouter();

  console.log('[Index] Index');
  useEffect(() => {
    (async () => {
      console.log('[Index] useEffect');
      try {
        // 만약 OAuth 딥링크로 실행되었다면 먼저 처리
        console.log('[Index] getInitialURL');
        const initialUrl = await Linking.getInitialURL();
        console.log('[Index] initialUrl', initialUrl);
        if (initialUrl) {
          console.log('[Index] handleRedirect');
          try { await handleRedirect(initialUrl); } catch (e) {
            console.log('[Index] handleRedirect error', e);
          }
        }
        // 1) 현재 세션 확인
        const { data: { session } } = await supabase.auth.getSession();
        // console.log('[Index] session', session);

        // 2) 세션이 있으면 → Home, 없으면 → Login
        // console.log('[Index] Index', session);
        if (session) {
        //   console.log('[Index] HomeScreen');
          router.replace('/(tabs)');   // 이미 있는 홈 화면
        } else {
        //   console.log('[Index] Login');
          router.replace('/(auth)/login');        // 이미 있는 로그인 화면
        }
      } catch (e) {
        console.log('[Index] useEffect error', e);
      } finally {
        // 스플래시 숨기기
        // (안드로이드에서 조금 늦게 숨기는 게 잔상/깜빡임 방지에 유리)
        if (Platform.OS === 'android') {
          setTimeout(() => SplashScreen.hideAsync(), 50);
        } else {
          SplashScreen.hideAsync();
        }
      }
    })();
  }, [router]);

  // 이 화면은 사용자에게 거의 보이지 않음(스플래시 아래)
  return null;
}
