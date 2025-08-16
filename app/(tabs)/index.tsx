import { useSession } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const { session, isLoading } = useSession();
  const router = useRouter();
  
  console.log('[HomeScreen] Rendering HomeScreen');
  
  useEffect(() => {
    console.log('[HomeScreen] Session check - Session:', !!session, 'Loading:', isLoading);
    
    // 로딩이 완료되고 세션이 없으면 로그인 화면으로 이동
    if (!isLoading && !session) {
      console.log('[HomeScreen] No session found, redirecting to login');
      router.replace('/(auth)/login' as any);
    }
  }, [session, isLoading, router]);

  // 로딩 중이면 로딩 화면 표시
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>돋보길</Text>
        <Text style={styles.subtitle}>로딩 중...</Text>
      </View>
    );
  }

  // 세션이 없으면 빈 화면 (리다이렉트 진행 중)
  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.subtitle}>로그인 화면으로 이동 중...</Text>
      </View>
    );
  }

  // 로그인된 사용자를 위한 홈 화면
  return (
    <View style={styles.container}>
      <Text style={styles.title}>돋보길</Text>
      <Text style={styles.subtitle}>안전한 길안내 서비스</Text>
      <Text style={styles.note}>
        로그인되었습니다. 홈 화면이 정상적으로 렌더링되었습니다.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  note: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
  },
});