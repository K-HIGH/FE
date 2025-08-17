import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSession } from '@/context/AuthContext';
import { supabase } from '@/services/supabaseClient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Button, StyleSheet, View } from 'react-native';
/**
 * 로그인 화면 컴포넌트
 * Supabase OAuth를 통한 소셜 로그인 제공
 */
export default function LoginScreen() {
  const { signInWithOAuth, session, isLoading, user } = useSession();
  const router = useRouter();

  // 세션 상태 변경 감지하여 자동 리다이렉트
  useEffect(() => {
    if (session && user) {
      // 사용자 메타데이터에 name과 role이 있는지 확인
      const hasProfile = user.user_metadata?.name && user.user_metadata?.role;
      
      if (hasProfile) {
        // 프로필이 완성된 경우 메인 화면으로 이동
        router.replace('/(tabs)');
      } else {
        // 프로필이 없는 경우 회원가입 화면으로 이동
        router.replace('/(auth)/register');
      }
    }
  }, [session, user, router]);

  const go = async (provider: 'google' | 'kakao') => {
    console.log('[OAuth] go', provider);
    await signInWithOAuth(provider);
    // 세션 확인
    const { data: { session } } = await supabase.auth.getSession();
    console.log('[OAuth] go', provider, session);
    if (session) {
      router.replace('/(tabs)');
    }
  };

  // 로딩 중이면 로딩 표시
  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>로딩 중...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>돋보길</ThemedText>
      <ThemedText style={styles.subtitle}>
        안전한 길안내 서비스에 오신 것을 환영합니다
      </ThemedText>
      
      <View style={styles.buttonContainer}>
        <Button
          title="카카오로 로그인"
          onPress={() => go('kakao')}
          disabled={isLoading}
        />
        <Button
          title="구글로 로그인"
          onPress={() => go('google')}
          disabled={isLoading}
        />
      </View>
      
      <ThemedText style={styles.notice}>
        로그인하면 서비스 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    maxWidth: 300,
  },
  notice: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 32,
    paddingHorizontal: 20,
  },
});
