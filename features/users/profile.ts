import { api } from '@/services/apiClient';

/**
 * 사용자 프로필 정보 타입
 * API 응답 UserProfileAlertRes와 일치
 */
export interface UserProfile {
  /** 사용자 이름 */
  user_name: string;
  /** 전화번호 */
  phone: string;
  /** 보호인 여부 */
  is_caregiver: boolean;
  /** 도우미 여부 */
  is_helper: boolean;
  /** FCM 토큰 (선택적) */
  fcm_token?: string | null;
  /** 알림 설정 여부 */
  is_alert: boolean;
}

/**
 * 사용자 프로필 업데이트 요청 타입
 * API 요청 UserProfileUpdateReq와 일치
 */
export interface UserProfileUpdateRequest {
  /** 사용자 이름 */
  user_name: string;
  /** 전화번호 */
  phone: string;
  /** 보호인 여부 */
  is_caregiver: boolean;
  /** 도우미 여부 */
  is_helper: boolean;
}

/**
 * 사용자 프로필 업데이트 응답 타입
 */
export interface UserProfileUpdateResponse {
  /** 사용자 이름 */
  user_name: string;
  /** 전화번호 */
  phone: string;
  /** 보호인 여부 */
  is_caregiver: boolean;
  /** 도우미 여부 */
  is_helper: boolean;
}

/**
 * 사용자 프로필 에러 타입
 */
export interface ProfileError {
  type: 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  code?: number;
}

/**
 * 현재 인증된 사용자의 프로필 정보를 가져옵니다.
 * GET /api/v1/users/me
 * 
 * @returns 사용자 프로필 정보 또는 null
 * @throws ProfileError
 */
export const getProfile = async (): Promise<UserProfile | null> => {
  try {
    const response = await api.get<UserProfile>('/api/v1/users/me');
    
    if (response.status === 200 && response.data) {
      console.log('프로필 조회 성공:', response.data);
      return response.data;
    }
    
    return null;
  } catch (error: any) {
    console.error('프로필 조회 실패:', error);
    
    if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 401:
          throw {
            type: 'UNAUTHORIZED',
            message: '인증이 필요합니다. 다시 로그인해주세요.',
            code: status,
          } as ProfileError;
        default:
          throw {
            type: 'UNKNOWN_ERROR',
            message: `서버 오류: ${status}`,
            code: status,
          } as ProfileError;
      }
    } else if (error.request) {
      throw {
        type: 'NETWORK_ERROR',
        message: '네트워크 연결을 확인해주세요.',
      } as ProfileError;
    } else {
      throw {
        type: 'UNKNOWN_ERROR',
        message: error.message || '알 수 없는 오류가 발생했습니다.',
      } as ProfileError;
    }
  }
};

/**
 * 사용자 프로필 정보를 업데이트합니다.
 * PUT /api/v1/users/me/profile
 * 
 * @param profileData - 업데이트할 프로필 정보
 * @returns 업데이트된 프로필 정보
 * @throws ProfileError
 */
export const updateProfile = async (
  profileData: UserProfileUpdateRequest
): Promise<UserProfileUpdateResponse> => {
  try {
    const response = await api.put<UserProfileUpdateResponse>(
      '/api/v1/users/me/profile',
      profileData
    );
    
    if (response.status === 200 && response.data) {
      console.log('프로필 업데이트 성공:', response.data);
      return response.data;
    }
    
    throw new Error(`예상치 못한 응답: ${response.status}`);
  } catch (error: any) {
    console.error('프로필 업데이트 실패:', error);
    
    if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 401:
          throw {
            type: 'UNAUTHORIZED',
            message: '인증이 필요합니다. 다시 로그인해주세요.',
            code: status,
          } as ProfileError;
        case 422:
          throw {
            type: 'VALIDATION_ERROR',
            message: '입력 정보가 올바르지 않습니다. 다시 확인해주세요.',
            code: status,
          } as ProfileError;
        default:
          throw {
            type: 'UNKNOWN_ERROR',
            message: `서버 오류: ${status}`,
            code: status,
          } as ProfileError;
      }
    } else if (error.request) {
      throw {
        type: 'NETWORK_ERROR',
        message: '네트워크 연결을 확인해주세요.',
      } as ProfileError;
    } else {
      throw {
        type: 'UNKNOWN_ERROR',
        message: error.message || '알 수 없는 오류가 발생했습니다.',
      } as ProfileError;
    }
  }
};

/**
 * 현재 사용자를 삭제합니다.
 * DELETE /api/v1/users/me
 * 
 * @returns 삭제 성공 여부
 * @throws ProfileError
 */
export const deleteUser = async (): Promise<boolean> => {
  try {
    const response = await api.delete('/api/v1/users/me');
    
    if (response.status === 200) {
      console.log('사용자 삭제 성공');
      return true;
    }
    
    return false;
  } catch (error: any) {
    console.error('사용자 삭제 실패:', error);
    
    if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 401:
          throw {
            type: 'UNAUTHORIZED',
            message: '인증이 필요합니다. 다시 로그인해주세요.',
            code: status,
          } as ProfileError;
        default:
          throw {
            type: 'UNKNOWN_ERROR',
            message: `서버 오류: ${status}`,
            code: status,
          } as ProfileError;
      }
    } else if (error.request) {
      throw {
        type: 'NETWORK_ERROR',
        message: '네트워크 연결을 확인해주세요.',
      } as ProfileError;
    } else {
      throw {
        type: 'UNKNOWN_ERROR',
        message: error.message || '알 수 없는 오류가 발생했습니다.',
      } as ProfileError;
    }
  }
};

/**
 * 사용자가 프로필을 완성했는지 확인합니다.
 * 
 * @returns 프로필 완성 여부
 */
export const isProfileComplete = async (): Promise<boolean> => {
  try {
    const profile = await getProfile();
    
    if (!profile) {
      return false;
    }
    
    // 필수 필드들이 모두 채워져 있는지 확인
    const requiredFields = [
      profile.user_name?.trim(),
      profile.phone?.trim(),
    ];
    
    const isComplete = requiredFields.every(field => field && field.length > 0);
    
    console.log('프로필 완성 상태:', isComplete, profile);
    return isComplete;
  } catch (error) {
    console.error('프로필 완성 상태 확인 실패:', error);
    return false;
  }
};

/**
 * 간편 함수: 보호인 여부 확인
 * 
 * @returns 보호인 여부
 */
export const isCaregiver = async (): Promise<boolean> => {
  try {
    const profile = await getProfile();
    return profile?.is_caregiver ?? false;
  } catch (error) {
    console.error('보호인 여부 확인 실패:', error);
    return false;
  }
};

/**
 * 간편 함수: 도우미 여부 확인
 * 
 * @returns 도우미 여부
 */
export const isHelper = async (): Promise<boolean> => {
  try {
    const profile = await getProfile();
    return profile?.is_helper ?? false;
  } catch (error) {
    console.error('도우미 여부 확인 실패:', error);
    return false;
  }
}; 