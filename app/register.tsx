import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, TextInput, View } from 'react-native';
import { useSession } from '../context/AuthContext';
// import { createUser } from '../services/userService'; // Temporarily removed

type Role = 'dependent' | 'caregiver';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role | null>(null);
  const router = useRouter();
  const { kakaoId } = useLocalSearchParams<{ kakaoId: string }>();
  const { signIn } = useSession();

  const handleRegister = async () => {
    if (!name.trim()) {
      return Alert.alert('오류', '이름을 입력해주세요.');
    }
    if (!role) {
      return Alert.alert('오류', '역할을 선택해주세요.');
    }
    if (!kakaoId) {
      return Alert.alert('오류', '사용자 정보가 올바르지 않습니다.');
    }

    // TODO: Re-implement with Supabase's createUser function
    Alert.alert('가입 정보 (임시)', `이름: ${name}, 역할: ${role}, 카카오ID: ${kakaoId}`);
    signIn();
    router.replace('/(tabs)');
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">추가 정보 입력</ThemedText>
      <ThemedText>서비스 이용을 위해 추가 정보를 입력해주세요.</ThemedText>
      
      <TextInput
        style={styles.input}
        placeholder="이름"
        value={name}
        onChangeText={setName}
        placeholderTextColor="#888"
      />
      
      <View style={styles.roleContainer}>
        <ThemedText>역할 선택</ThemedText>
        <View style={styles.roleButtons}>
          <Button
            title="피보호인"
            onPress={() => setRole('dependent')}
            color={role === 'dependent' ? '#1E90FF' : '#888'}
          />
          <Button
            title="보호인"
            onPress={() => setRole('caregiver')}
            color={role === 'caregiver' ? '#1E90FF' : '#888'}
          />
        </View>
      </View>

      <Button title="가입 완료" onPress={handleRegister} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 16,
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
    gap: 8,
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  }
}); 