import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

// 네이티브 스플래시를 자동으로 숨기지 않게 설정
SplashScreen.preventAutoHideAsync().catch(() => {
  // 에러 발생 시 무시 (이미 숨겨진 경우 등)
});

/**
 * 앱의 첫 번째 화면 (스플래시 화면)
 * 1초 후 자동으로 홈 화면으로 이동
 */
export default function Index() {
  const router = useRouter();

  console.log('[Index] Index component loaded');
  
  useEffect(() => {
    console.log('[Index] useEffect - starting navigation');
    
    // 1초 후에 홈 화면으로 이동
    const timer = setTimeout(() => {
      console.log('[Index] Navigating to tabs');
      router.replace('/(tabs)' as any);
      
      // 스플래시 화면 숨기기
      if (Platform.OS === 'android') {
        // Android에서는 약간의 지연 후 숨기기 (깜빡임 방지)
        setTimeout(() => SplashScreen.hideAsync(), 50);
      } else {
        SplashScreen.hideAsync();
      }
    }, 1000);

    // 컴포넌트 언마운트 시 타이머 정리
    return () => clearTimeout(timer);
  }, [router]);

  // 스플래시 화면이 보이는 동안 빈 화면 렌더링
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // 스플래시와 동일한 배경색
  },
}); 