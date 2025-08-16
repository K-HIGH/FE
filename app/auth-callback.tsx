import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text } from 'react-native';

export default function AuthCallback() {
  const router = useRouter();
  useEffect(() => {
    // 세션 처리(_layout에서 이미 처리) 후 홈 등으로 이동
    const t = setTimeout(() => router.replace('/'), 50);
    return () => clearTimeout(t);
  }, [router]);
  return <Text>Signing you in…</Text>;
}
