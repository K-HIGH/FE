import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, TextInput, View } from 'react-native';
import { useSession } from '../../context/AuthContext';

type Role = 'dependent' | 'caregiver';

/**
 * 회원가입 화면 컴포넌트
 * OAuth 로그인 후 추가 프로필 정보를 입력받아 Supabase에 저장
 */
export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { user, updateProfile, session } = useSession();

  // 세션이 없으면 로그인 화면으로 리다이렉트
  useEffect(() => {
    if (!session || !user) {
      router.replace('/(auth)/login');
      return;
    }

    // 이미 프로필이 완성된 사용자는 메인 화면으로 리다이렉트
    const hasProfile = user.user_metadata?.name && user.user_metadata?.role;
    if (hasProfile) {
      router.replace('/(tabs)');
    }
  }, [session, user, router]);

  /**
   * 회원가입 처리
   * 사용자 프로필 정보를 Supabase에 업데이트
   */
  const handleRegister = async () => {
    // 입력값 검증
    if (!name.trim()) {
      return Alert.alert('오류', '이름을 입력해주세요.');
    }
    if (!role) {
      return Alert.alert('오류', '역할을 선택해주세요.');
    }
    if (!user) {
      return Alert.alert('오류', '사용자 정보가 올바르지 않습니다.');
    }

    try {
      setIsSubmitting(true);

      // Supabase 사용자 프로필 업데이트
      await updateProfile({
        name: name.trim(),
        role,
      });

      Alert.alert(
        '가입 완료',
        '프로필이 성공적으로 등록되었습니다.',
        [
          {
            text: '확인',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      Alert.alert(
        '오류',
        '프로필 등록 중 오류가 발생했습니다. 다시 시도해주세요.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 로딩 중이거나 세션이 없으면 로딩 표시
  if (!session || !user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>로딩 중...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>추가 정보 입력</ThemedText>
      <ThemedText style={styles.subtitle}>
        서비스 이용을 위해 추가 정보를 입력해주세요.
      </ThemedText>
      
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="이름을 입력해주세요"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#888"
          editable={!isSubmitting}
          maxLength={20}
        />
        
        <View style={styles.roleContainer}>
          <ThemedText style={styles.roleLabel}>역할 선택</ThemedText>
          <ThemedText style={styles.roleDescription}>
            서비스 이용 목적에 맞는 역할을 선택해주세요.
          </ThemedText>
          <View style={styles.roleButtons}>
            <Button
              title="피보호인"
              onPress={() => setRole('dependent')}
              color={role === 'dependent' ? '#1E90FF' : '#888'}
              disabled={isSubmitting}
            />
            <Button
              title="보호인"
              onPress={() => setRole('caregiver')}
              color={role === 'caregiver' ? '#1E90FF' : '#888'}
              disabled={isSubmitting}
            />
          </View>
        </View>

        <Button 
          title={isSubmitting ? "등록 중..." : "가입 완료"} 
          onPress={handleRegister}
          disabled={isSubmitting}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 32,
  },
  formContainer: {
    gap: 24,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  roleContainer: {
    gap: 12,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  roleDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  },
}); 