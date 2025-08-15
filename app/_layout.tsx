import { useSession } from '@/context/AuthContext';
import { handleRedirect } from '@/features/auth/oauth';
import { refreshSessionInServer } from '@/features/auth/session';
import { supabase } from '@/services/supabaseClient';
import * as Linking from 'expo-linking';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect } from 'react';

function RootLayoutNav() {
  const { session, isLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (session) {
      router.replace('/(tabs)');
    } else {
      router.replace('/screens/login');
    }
  }, [session, isLoading, router]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="screens/login" options={{ headerShown: false }} />
      <Stack.Screen name="screens/register" options={{ title: '가입하기' }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();

    const sub = Linking.addEventListener('url', async ({ url }) => {
      try { await handleRedirect(url); } catch (e) {
        console.log('[OAuth] handleRedirect error', e);
      }
    });

    (async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        try { await handleRedirect(initialUrl); } catch (e) {
          console.log('[OAuth] handleRedirect error', e);
        }
      }
    })();

    const authSub = supabase.auth.onAuthStateChange((_evt, _session) => {
      if (_session?.access_token) {
        refreshSessionInServer(_session.access_token);
      }
    });

    return () => {
      sub.remove();
      authSub.data.subscription.unsubscribe();
    };
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
