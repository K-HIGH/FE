import { api } from '../../services/apiClient';

/**
 * 위치 정보 응답 타입
 * API 응답 예시와 일치
 */
export interface LocationData {
  /** 위도 */
  latitude: number;
  /** 경도 */
  longitude: number;
  /** 고도 (미터) */
  altitude: number;
  /** 속도 (m/s) */
  speed: number;
  /** 방향 (도, 0-360) */
  direction: number;
  /** 마지막 업데이트 시간 (클라이언트에서 추가) */
  timestamp?: Date;
}

/**
 * 위치 추적 에러 타입
 */
export interface LocationReceiverError {
  type: 'USER_NOT_FOUND' | 'FORBIDDEN' | 'UNAUTHORIZED' | 'NETWORK_ERROR' | 'API_ERROR';
  message: string;
  code?: number;
}

/**
 * 위치 추적 설정 옵션
 */
export interface LocationReceiverOptions {
  /** 위치 조회 간격 (밀리초) */
  interval?: number;
  /** 에러 발생 시 재시도 횟수 */
  maxRetries?: number;
  /** 재시도 간격 (밀리초) */
  retryDelay?: number;
  /** 위치 변화 감지 임계값 (미터) */
  changeThreshold?: number;
  /** 오프라인 감지 시간 (밀리초) */
  offlineThreshold?: number;
}

/**
 * 위치 변화 이벤트 타입
 */
export interface LocationChangeEvent {
  /** 사용자 ULID */
  userUlid: string;
  /** 새로운 위치 정보 */
  location: LocationData;
  /** 이전 위치 정보 */
  previousLocation?: LocationData;
  /** 이동 거리 (미터) */
  distanceMoved?: number;
}

/**
 * 위치 추적 상태 타입
 */
export type TrackingStatus = 'stopped' | 'tracking' | 'error' | 'offline';

/**
 * 피보호자 위치 수신 클래스
 * 특정 사용자의 실시간 위치 정보를 주기적으로 가져와서 추적
 */
export class LocationReceiver {
  private trackingInterval: ReturnType<typeof setInterval> | null = null;
  private isTracking = false;
  private lastKnownLocation: LocationData | null = null;
  private options: Required<LocationReceiverOptions>;
  private retryCount = 0;
  private status: TrackingStatus = 'stopped';
  private lastUpdateTime: Date | null = null;

  // 이벤트 콜백들
  private onLocationChange?: (event: LocationChangeEvent) => void;
  private onError?: (error: LocationReceiverError) => void;
  private onStatusChange?: (status: TrackingStatus) => void;

  constructor(options: LocationReceiverOptions = {}) {
    this.options = {
      interval: options.interval ?? 5000, // 기본 5초
      maxRetries: options.maxRetries ?? 3,
      retryDelay: options.retryDelay ?? 2000, // 기본 2초
      changeThreshold: options.changeThreshold ?? 5, // 기본 5미터
      offlineThreshold: options.offlineThreshold ?? 30000, // 기본 30초
    };
  }

  /**
   * 상태 변경 처리
   * @param newStatus - 새로운 상태
   */
  private setStatus(newStatus: TrackingStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.onStatusChange?.(newStatus);
      console.log(`위치 추적 상태 변경: ${newStatus}`);
    }
  }

  /**
   * 두 위치 간의 거리 계산 (Haversine 공식)
   * @param loc1 - 첫 번째 위치
   * @param loc2 - 두 번째 위치
   * @returns 거리 (미터)
   */
  private calculateDistance(loc1: LocationData, loc2: LocationData): number {
    const R = 6371000; // 지구 반지름 (미터)
    const lat1Rad = (loc1.latitude * Math.PI) / 180;
    const lat2Rad = (loc2.latitude * Math.PI) / 180;
    const deltaLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const deltaLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  /**
   * 특정 사용자의 위치 정보를 서버에서 가져오기
   * @param userUlid - 사용자 ULID
   * @returns 위치 정보 또는 null
   */
  private async fetchLocationFromServer(userUlid: string): Promise<LocationData | null> {
    try {
      const response = await api.get<LocationData>(`/api/v1/locations/track/${userUlid}`);
      
      if (response.status === 200 && response.data) {
        const locationData: LocationData = {
          ...response.data,
          timestamp: new Date(),
        };
        
        this.lastUpdateTime = new Date();
        this.retryCount = 0; // 성공 시 재시도 카운트 초기화
        
        return locationData;
      }

      throw new Error(`API 응답 오류: ${response.status}`);
    } catch (error: any) {
      console.error('위치 정보 가져오기 실패:', error);
      
      // 에러 타입 분류
      let errorType: LocationReceiverError['type'] = 'API_ERROR';
      let message = '위치 정보를 가져올 수 없습니다.';

      if (error.response) {
        const status = error.response.status;
        switch (status) {
          case 401:
            errorType = 'UNAUTHORIZED';
            message = '인증이 필요합니다.';
            break;
          case 403:
            errorType = 'FORBIDDEN';
            message = '해당 사용자의 위치에 접근할 권한이 없습니다.';
            break;
          case 404:
            errorType = 'USER_NOT_FOUND';
            message = '사용자를 찾을 수 없습니다.';
            break;
          default:
            message = `서버 오류: ${status}`;
        }
      } else if (error.request) {
        errorType = 'NETWORK_ERROR';
        message = '네트워크 연결을 확인해주세요.';
      }

      const locationError: LocationReceiverError = {
        type: errorType,
        message,
        code: error.response?.status,
      };

      // 재시도 로직
      if (this.retryCount < this.options.maxRetries && errorType !== 'FORBIDDEN' && errorType !== 'USER_NOT_FOUND') {
        this.retryCount++;
        console.log(`${this.options.retryDelay}ms 후 재시도 (${this.retryCount}/${this.options.maxRetries})`);
        
        setTimeout(() => {
          if (this.isTracking) {
            this.fetchLocationFromServer(userUlid);
          }
        }, this.options.retryDelay);
      } else {
        this.onError?.(locationError);
        this.setStatus('error');
        this.retryCount = 0;
      }
      
      return null;
    }
  }

  /**
   * 오프라인 상태 체크
   */
  private checkOfflineStatus(): void {
    if (this.lastUpdateTime) {
      const timeSinceLastUpdate = Date.now() - this.lastUpdateTime.getTime();
      if (timeSinceLastUpdate > this.options.offlineThreshold) {
        this.setStatus('offline');
      }
    }
  }

  /**
   * 특정 사용자의 위치 추적 시작
   * @param userUlid - 추적할 사용자의 ULID
   */
  async startTracking(userUlid: string): Promise<void> {
    if (this.isTracking) {
      console.warn('이미 위치 추적이 시작되었습니다.');
      return;
    }

    if (!userUlid) {
      throw new Error('사용자 ULID가 필요합니다.');
    }

    try {
      this.isTracking = true;
      this.setStatus('tracking');
      
      // 즉시 한 번 위치 가져오기
      const initialLocation = await this.fetchLocationFromServer(userUlid);
      if (initialLocation) {
        this.lastKnownLocation = initialLocation;
        this.onLocationChange?.({
          userUlid,
          location: initialLocation,
        });
      }

      // 주기적으로 위치 정보 가져오기
      this.trackingInterval = setInterval(async () => {
        if (!this.isTracking) return;

        const currentLocation = await this.fetchLocationFromServer(userUlid);
        if (!currentLocation) {
          this.checkOfflineStatus();
          return;
        }

        // 위치 변화 감지
        let distanceMoved: number | undefined;
        if (this.lastKnownLocation) {
          distanceMoved = this.calculateDistance(this.lastKnownLocation, currentLocation);
          
          // 임계값 이상 변화한 경우에만 이벤트 발생
          if (distanceMoved >= this.options.changeThreshold) {
            this.onLocationChange?.({
              userUlid,
              location: currentLocation,
              previousLocation: this.lastKnownLocation,
              distanceMoved,
            });
          }
        } else {
          // 첫 번째 위치 정보
          this.onLocationChange?.({
            userUlid,
            location: currentLocation,
          });
        }

        this.lastKnownLocation = currentLocation;
        this.setStatus('tracking');
      }, this.options.interval);

      console.log(`사용자 ${userUlid}의 위치 추적을 시작했습니다.`);
    } catch (error) {
      this.isTracking = false;
      this.setStatus('error');
      console.error('위치 추적 시작 실패:', error);
      throw error;
    }
  }

  /**
   * 위치 추적 중지
   */
  stopTracking(): void {
    if (!this.isTracking) {
      console.warn('위치 추적이 시작되지 않았습니다.');
      return;
    }

    this.isTracking = false;
    this.setStatus('stopped');
    
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    this.lastKnownLocation = null;
    this.lastUpdateTime = null;
    this.retryCount = 0;

    console.log('위치 추적이 중지되었습니다.');
  }

  /**
   * 현재 추적 상태 확인
   * @returns 추적 중 여부
   */
  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  /**
   * 현재 추적 상태 반환
   * @returns 추적 상태
   */
  getStatus(): TrackingStatus {
    return this.status;
  }

  /**
   * 마지막으로 알려진 위치 정보 반환
   * @returns 마지막 위치 정보 또는 null
   */
  getLastKnownLocation(): LocationData | null {
    return this.lastKnownLocation;
  }

  /**
   * 추적 설정 업데이트
   * @param newOptions - 새로운 설정 옵션
   */
  updateOptions(newOptions: Partial<LocationReceiverOptions>): void {
    this.options = { ...this.options, ...newOptions };
    
    // 추적 중이라면 재시작
    // TODO: 추적 재시작 로직 재구성 필요
    if (this.isTracking && this.trackingInterval) {
      const wasTracking = this.isTracking;
      this.stopTracking();
      if (wasTracking) {
        // 현재 추적 중인 사용자 정보가 있다면 재시작
        console.log('설정 변경으로 인한 추적 재시작이 필요합니다.');
      }
    }
  }

  /**
   * 위치 변화 이벤트 리스너 등록
   * @param callback - 위치 변화 시 호출될 콜백
   */
  onLocationChanged(callback: (event: LocationChangeEvent) => void): void {
    this.onLocationChange = callback;
  }

  /**
   * 에러 이벤트 리스너 등록
   * @param callback - 에러 발생 시 호출될 콜백
   */
  onErrorOccurred(callback: (error: LocationReceiverError) => void): void {
    this.onError = callback;
  }

  /**
   * 상태 변화 이벤트 리스너 등록
   * @param callback - 상태 변화 시 호출될 콜백
   */
  onStatusChanged(callback: (status: TrackingStatus) => void): void {
    this.onStatusChange = callback;
  }

  /**
   * 특정 사용자의 위치 정보 한 번만 가져오기
   * @param userUlid - 사용자 ULID
   * @returns 위치 정보 또는 null
   */
  async getLocationOnce(userUlid: string): Promise<LocationData | null> {
    return this.fetchLocationFromServer(userUlid);
  }
}

/**
 * 다중 사용자 위치 추적 관리자
 * 여러 피보호자의 위치를 동시에 추적
 */
export class MultiLocationReceiver {
  private receivers: Map<string, LocationReceiver> = new Map();
  private globalOptions: LocationReceiverOptions;

  constructor(options: LocationReceiverOptions = {}) {
    this.globalOptions = options;
  }

  /**
   * 사용자 추적 추가
   * @param userUlid - 사용자 ULID
   * @param options - 개별 추적 옵션 (선택사항)
   */
  async addUser(userUlid: string, options?: LocationReceiverOptions): Promise<void> {
    if (this.receivers.has(userUlid)) {
      console.warn(`사용자 ${userUlid}는 이미 추적 중입니다.`);
      return;
    }

    const receiver = new LocationReceiver({ ...this.globalOptions, ...options });
    this.receivers.set(userUlid, receiver);
    
    await receiver.startTracking(userUlid);
  }

  /**
   * 사용자 추적 제거
   * @param userUlid - 사용자 ULID
   */
  removeUser(userUlid: string): void {
    const receiver = this.receivers.get(userUlid);
    if (receiver) {
      receiver.stopTracking();
      this.receivers.delete(userUlid);
    }
  }

  /**
   * 모든 추적 중지
   */
  stopAll(): void {
    this.receivers.forEach((receiver) => {
      receiver.stopTracking();
    });
    this.receivers.clear();
  }

  /**
   * 특정 사용자의 수신기 가져오기
   * @param userUlid - 사용자 ULID
   * @returns 위치 수신기 또는 undefined
   */
  getReceiver(userUlid: string): LocationReceiver | undefined {
    return this.receivers.get(userUlid);
  }

  /**
   * 모든 추적 중인 사용자 목록
   * @returns 사용자 ULID 배열
   */
  getTrackedUsers(): string[] {
    return Array.from(this.receivers.keys());
  }

  /**
   * 모든 사용자의 마지막 위치 정보
   * @returns 사용자별 위치 정보 맵
   */
  getAllLastLocations(): Map<string, LocationData | null> {
    const locations = new Map<string, LocationData | null>();
    this.receivers.forEach((receiver, userUlid) => {
      locations.set(userUlid, receiver.getLastKnownLocation());
    });
    return locations;
  }
}

/**
 * 전역 위치 수신기 인스턴스
 */
export const locationReceiver = new LocationReceiver();

/**
 * 전역 다중 위치 수신기 인스턴스
 */
export const multiLocationReceiver = new MultiLocationReceiver();

/**
 * 간편 함수: 단일 사용자 위치 추적 시작
 * @param userUlid - 사용자 ULID
 * @param options - 추적 옵션
 */
export const startUserTracking = async (
  userUlid: string,
  options?: LocationReceiverOptions
): Promise<void> => {
  if (options) {
    locationReceiver.updateOptions(options);
  }
  await locationReceiver.startTracking(userUlid);
};

/**
 * 간편 함수: 위치 추적 중지
 */
export const stopUserTracking = (): void => {
  locationReceiver.stopTracking();
};

/**
 * 간편 함수: 사용자 위치 한 번만 가져오기
 * @param userUlid - 사용자 ULID
 * @returns 위치 정보
 */
export const getUserLocationOnce = async (userUlid: string): Promise<LocationData | null> => {
  return locationReceiver.getLocationOnce(userUlid);
};
