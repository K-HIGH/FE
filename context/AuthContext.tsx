import { signInWithOAuth } from '@/features/auth/oauth';
import { clearAccessToken, refreshSessionInServer } from '@/features/auth/session';
import { supabase } from '@/services/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

/**
 * 인증 컨텍스트 데이터 타입 정의
 * Supabase Auth와 연동된 사용자 인증 상태 관리
 */
interface AuthContextData {
  /** 현재 사용자 세션 */
  session: Session | null;
  /** 현재 사용자 정보 */
  user: User | null;
  /** 로딩 상태 */
  isLoading: boolean;
  /** OAuth 로그인 함수 (카카오, 구글 등) */
  signInWithOAuth: (provider: 'kakao' | 'google') => Promise<void>;
  /** 로그아웃 함수 */
  signOut: () => Promise<void>;
  /** 사용자 프로필 업데이트 */
  updateProfile: (updates: { name?: string; role?: string }) => Promise<void>;
}

// 기본값으로 AuthContext 생성
const AuthContext = createContext<AuthContextData|undefined>(undefined);

/**
 * AuthContext를 사용하기 위한 커스텀 훅
 * @returns AuthContextData
 * @throws Error - SessionProvider로 감싸지지 않은 경우
 */
export function useSession() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useSession must be wrapped in a <SessionProvider />');
  }
  return value;
}

/**
 * 인증 상태를 관리하는 Provider 컴포넌트
 * Supabase Auth와 연동하여 세션 상태를 자동으로 관리
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 초기 세션 상태 확인
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('세션 가져오기 오류:', error);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('초기 세션 확인 중 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // 인증 상태 변경 리스너 설정
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        console.log('event', event);
        if (session?.access_token) {
          refreshSessionInServer(session.access_token);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // 컴포넌트 언마운트 시 리스너 정리
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * 로그아웃
   */
  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('로그아웃 오류:', error);
        throw error;
      }
      await clearAccessToken();
    } catch (error) {
      console.error('로그아웃 중 오류:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 사용자 프로필 업데이트
   * @param updates - 업데이트할 프로필 정보
   */
  const updateProfile = async (updates: { name?: string; role?: string }) => {
    try {
      if (!user) {
        throw new Error('로그인된 사용자가 없습니다.');
      }

      const { error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) {
        console.error('프로필 업데이트 오류:', error);
        throw error;
      }
    } catch (error) {
      console.error('프로필 업데이트 중 오류:', error);
      throw error;
    }
  };

  const authContextValue: AuthContextData = {
    session,
    user,
    isLoading,
    signInWithOAuth,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
} 