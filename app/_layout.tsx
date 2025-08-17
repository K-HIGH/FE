import { SessionProvider } from '@/context/AuthContext';
import { handleRedirect } from '@/features/auth/oauth';
import { clearSessionInServer, refreshSessionInServer } from '@/features/auth/session';
import { supabase } from '@/services/supabaseClient';
import * as Linking from 'expo-linking';
import { Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect } from 'react';

function RootLayoutNav() {
  console.log('[Layout][RootLayoutNav] Layout loaded');
  
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/register" options={{ title: '가입하기' }} />
      <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();

    const sub = Linking.addEventListener('url', async ({ url }) => {
      try { 
        await handleRedirect(url); 
      } catch (e) {
        console.log('[OAuth] handleRedirect error', e);
      }
    });

    (async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        try { 
          await handleRedirect(initialUrl); 
        } catch (e) {
          console.log('[OAuth] handleRedirect error', e);
        }
      }
    })();

    const authSub = supabase.auth.onAuthStateChange((_evt, _session) => {
      if (_session?.access_token) {
        console.log('[Layout] authStateChange: refresh', _session.access_token);
        refreshSessionInServer(_session.access_token);
      }
      else if (!_session?.access_token) {
        console.log('[Layout] authStateChange: clear', _session);
        clearSessionInServer();
      }
    });

    return () => {
      sub.remove();
      authSub.data.subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionProvider>
      <RootLayoutNav />
    </SessionProvider>
  );
}