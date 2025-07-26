import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Alert, Button, StyleSheet } from 'react-native';
import { useSession } from '../context/AuthContext';
// import { checkUserExists } from '../services/userService'; // Temporarily removed

WebBrowser.maybeCompleteAuthSession();

const kakaoEndpoints = {
  authorization: 'https://kauth.kakao.com/oauth/authorize',
  token: 'https://kauth.kakao.com/oauth/token',
  userInfo: 'https://kapi.kakao.com/v2/user/me',
};

const NATIVE_APP_KEY = '2d7df6e1eb0cb1a319987d5ebfe132fb';
const REDIRECT_URI = `kakao${NATIVE_APP_KEY}://oauth`;

export default function LoginScreen() {
  const { signIn } = useSession();
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const authUrl = `${kakaoEndpoints.authorization}?client_id=${NATIVE_APP_KEY}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=profile_nickname,profile_image,account_email`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get('code');

        if (code) {
          getAccessToken(code);
        } else {
            const error = url.searchParams.get('error');
            if (error) {
                 Alert.alert('Login Canceled', `Error: ${error}`);
            }
        }
      } else if (result.type !== 'cancel' && result.type !== 'dismiss') {
        Alert.alert('Login Failed', 'The login flow was interrupted.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Login Error', 'An unexpected error occurred during login.');
    }
  };

  const getAccessToken = async (code: string) => {
    try {
      const tokenResponse = await fetch(kakaoEndpoints.token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: NATIVE_APP_KEY,
          redirect_uri: REDIRECT_URI,
          code,
        }).toString(),
      });

      const tokenData = await tokenResponse.json();
      if (tokenData.access_token) {
        getUserInfo(tokenData.access_token);
      } else {
        Alert.alert('Login Failed', `Failed to get access token. ${tokenData.error_description || ''}`);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Login Error', 'An error occurred while getting the access token.');
    }
  };

  const getUserInfo = async (accessToken: string) => {
    try {
      const userInfoResponse = await fetch(kakaoEndpoints.userInfo, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const userInfo = await userInfoResponse.json();

      // Temporarily redirect all users to register screen until Supabase is implemented
      router.replace({ pathname: '/register', params: { kakaoId: userInfo.id } });

    } catch (error) {
      console.error(error);
      Alert.alert('Login Error', 'An error occurred while fetching user information.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">돋보길</ThemedText>
      <Button
        title="카카오로 로그인"
        onPress={handleLogin}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
});
