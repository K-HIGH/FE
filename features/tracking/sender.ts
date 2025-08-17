import * as Location from 'expo-location';
import { api } from '../../services/apiClient';

/**
 * 위치 정보 송신 요청 타입
 * API 스펙의 TrackUpdateReq와 일치
 */
interface TrackUpdateRequest {
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
}

/**
 * 위치 정보 송신 응답 타입
 */
interface TrackUpdateResponse {
  detail: string;
}

/**
 * 위치 송신 에러 타입
 */
interface LocationSenderError {
  type: 'PERMISSION_DENIED' | 'NETWORK_ERROR' | 'LOCATION_UNAVAILABLE' | 'API_ERROR';
  message: string;
  code?: number;
}

/**
 * 위치 송신 설정 옵션
 */
interface LocationSenderOptions {
  /** 송신 간격 (밀리초) */
  interval?: number;
  /** 최소 거리 변화량 (미터) */
  distanceFilter?: number;
  /** 위치 정확도 */
  accuracy?: Location.LocationAccuracy;
  /** 에러 발생 시 재시도 횟수 */
  maxRetries?: number;
  /** 재시도 간격 (밀리초) */
  retryDelay?: number;
}

/**
 * 실시간 위치 정보 송신 클래스
 * 사용자의 현재 위치를 주기적으로 API 서버에 전송
 */
export class LocationSender {
  private isTracking = false;
  private trackingInterval: ReturnType<typeof setInterval> | null = null;
  private lastKnownLocation: Location.LocationObject | null = null;
  private options: Required<LocationSenderOptions>;
  private retryCount = 0;

  constructor(options: LocationSenderOptions = {}) {
    this.options = {
      interval: options.interval ?? 5000, // 기본 5초
      distanceFilter: options.distanceFilter ?? 10, // 기본 10미터
      accuracy: options.accuracy ?? Location.LocationAccuracy.High,
      maxRetries: options.maxRetries ?? 3,
      retryDelay: options.retryDelay ?? 2000, // 기본 2초
    };
  }

  /**
   * 위치 권한 요청 및 확인
   * @returns 권한 상태
   */
  private async requestLocationPermission(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        throw new Error('위치 권한이 거부되었습니다.');
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.warn('백그라운드 위치 권한이 거부되었습니다. 앱이 백그라운드에서 실행될 때 위치 추적이 제한될 수 있습니다.');
      }

      return true;
    } catch (error) {
      console.error('위치 권한 요청 실패:', error);
      return false;
    }
  }

  /**
   * 현재 위치 정보 가져오기
   * @returns 위치 정보 또는 null
   */
  private async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: this.options.accuracy,
      });

      this.lastKnownLocation = location;
      return location;
    } catch (error) {
      console.error('위치 정보 가져오기 실패:', error);
      
      // 마지막으로 알려진 위치가 있다면 반환
      if (this.lastKnownLocation) {
        console.warn('마지막으로 알려진 위치를 사용합니다.');
        return this.lastKnownLocation;
      }
      
      return null;
    }
  }

  /**
   * 위치 정보를 서버에 송신
   * @param location - 위치 정보
   * @returns 송신 성공 여부
   */
  private async sendLocationToServer(location: Location.LocationObject): Promise<boolean> {
    try {
      const trackData: TrackUpdateRequest = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude ?? 0,
        speed: location.coords.speed ?? 0,
        direction: location.coords.heading ?? 0,
      };

      const response = await api.put<TrackUpdateResponse>('/api/v1/locations/track/', trackData);
      
      if (response.status === 200) {
        console.log('위치 정보 송신 성공:', trackData);
        this.retryCount = 0; // 성공 시 재시도 카운트 초기화
        return true;
      }

      throw new Error(`API 응답 오류: ${response.status}`);
    } catch (error: any) {
      console.error('위치 정보 송신 실패:', error);
      
      // 재시도 로직
      if (this.retryCount < this.options.maxRetries) {
        this.retryCount++;
        console.log(`${this.options.retryDelay}ms 후 재시도 (${this.retryCount}/${this.options.maxRetries})`);
        
        setTimeout(() => {
          this.sendLocationToServer(location);
        }, this.options.retryDelay);
      } else {
        console.error('최대 재시도 횟수 초과. 위치 송신을 중단합니다.');
        this.retryCount = 0;
      }
      
      return false;
    }
  }

  /**
   * 위치 정보가 송신할 만큼 변화했는지 확인
   * @param newLocation - 새로운 위치
   * @param lastLocation - 마지막 송신된 위치
   * @returns 송신 필요 여부
   */
  private shouldSendLocation(
    newLocation: Location.LocationObject,
    lastLocation: Location.LocationObject | null
  ): boolean {
    if (!lastLocation) return true;

    // 하버사인 공식으로 거리 계산
    const distance = this.haversineDistance(
      newLocation.coords.latitude,
      newLocation.coords.longitude,
      lastLocation.coords.latitude,
      lastLocation.coords.longitude
    );
    return distance >= this.options.distanceFilter;
  }

  /**
   * 실시간 위치 추적 시작
   * @throws LocationSenderError
   */
  async startTracking(): Promise<void> {
    if (this.isTracking) {
      console.warn('이미 위치 추적이 시작되었습니다.');
      return;
    }

    try {
      // 위치 권한 확인
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        throw {
          type: 'PERMISSION_DENIED',
          message: '위치 권한이 필요합니다.',
        } as LocationSenderError;
      }

      // 위치 서비스 활성화 확인
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        throw {
          type: 'LOCATION_UNAVAILABLE',
          message: '위치 서비스가 비활성화되어 있습니다.',
        } as LocationSenderError;
      }

      this.isTracking = true;
      let lastSentLocation: Location.LocationObject | null = null;

      // 주기적으로 위치 정보 송신
      this.trackingInterval = setInterval(async () => {
        if (!this.isTracking) return;

        const currentLocation = await this.getCurrentLocation();
        if (!currentLocation) {
          console.warn('현재 위치를 가져올 수 없습니다.');
          return;
        }

        // 위치 변화가 충분한지 확인
        if (this.shouldSendLocation(currentLocation, lastSentLocation)) {
          const success = await this.sendLocationToServer(currentLocation);
          if (success) {
            lastSentLocation = currentLocation;
          }
        }
      }, this.options.interval);

      console.log('위치 추적이 시작되었습니다.');
    } catch (error) {
      this.isTracking = false;
      console.error('위치 추적 시작 실패:', error);
      throw error;
    }
  }

  /**
   * 실시간 위치 추적 중지
   */
  stopTracking(): void {
    if (!this.isTracking) {
      console.warn('위치 추적이 시작되지 않았습니다.');
      return;
    }

    this.isTracking = false;
    
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

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
   * 위치 송신 설정 업데이트
   * @param newOptions - 새로운 설정 옵션
   */
  updateOptions(newOptions: Partial<LocationSenderOptions>): void {
    this.options = { ...this.options, ...newOptions };
    
    // 추적 중이라면 재시작
    if (this.isTracking) {
      this.stopTracking();
      this.startTracking();
    }
  }

  /**
   * 마지막으로 알려진 위치 정보 반환
   * @returns 마지막 위치 정보 또는 null
   */
  getLastKnownLocation(): Location.LocationObject | null {
    return this.lastKnownLocation;
  }

  /**
   * 현재 위치를 한 번만 송신 (일회성)
   * 추적을 시작하지 않고 현재 위치만 서버에 전송
   * @returns 송신 성공 여부
   */
  async sendOnce(): Promise<boolean> {
    try {
      // 위치 권한 확인
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        console.warn('위치 권한이 없어 송신할 수 없습니다.');
        return false;
      }

      // 현재 위치 가져오기
      const location = await this.getCurrentLocation();
      if (!location) {
        console.warn('현재 위치를 가져올 수 없습니다.');
        return false;
      }

      // 서버에 송신
      const success = await this.sendLocationToServer(location);
      if (success) {
        console.log('일회성 위치 송신 성공');
      }
      
      return success;
    } catch (error) {
      console.error('일회성 위치 송신 실패:', error);
      return false;
    }
  }

  /**
 * 두 지점 간의 거리(미터)를 하버사인 공식으로 계산
 */
  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371000; // 지구 반지름 (미터)
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

/**
 * 전역 LocationSender 인스턴스
 * 앱 전체에서 하나의 인스턴스만 사용하도록 함
 */
export const locationSender = new LocationSender();

/**
 * 간편 함수: 위치 추적 시작
 * @param options - 송신 옵션
 */
export const startLocationTracking = async (options?: LocationSenderOptions): Promise<void> => {
  if (options) {
    locationSender.updateOptions(options);
  }
  await locationSender.startTracking();
};

/**
 * 간편 함수: 위치 추적 중지
 */
export const stopLocationTracking = (): void => {
  locationSender.stopTracking();
};

/**
 * 간편 함수: 현재 위치 한 번만 송신
 * @returns 송신 성공 여부
 */
export const sendCurrentLocation = async (): Promise<boolean> => {
  // 새로운 LocationSender 인스턴스 생성
  const sender = new LocationSender();
  
  // public sendOnce 메서드 사용 (캡슐화 보존)
  return await sender.sendOnce();
};

/**
 * 간편 함수: 전역 인스턴스로 현재 위치 한 번만 송신
 * 전역 locationSender 인스턴스를 재사용하여 성능 최적화
 * @returns 송신 성공 여부
 */
export const sendCurrentLocationWithGlobalInstance = async (): Promise<boolean> => {
  return await locationSender.sendOnce();
};
