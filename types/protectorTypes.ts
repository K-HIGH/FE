// 피보호인 상태 타입
export type DependentStatus = 'at_home' | 'out_with_destination' | 'out_without_destination';

// 위치 정보 인터페이스
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

// 피보호인 정보 인터페이스
export interface Dependent {
  id: string;
  name: string;
  status: DependentStatus;
  currentLocation: Location;
  homeLocation: Location;
  destination?: {
    name: string;
    location: Location;
  };
  lastUpdated: Date;
}

// 상태별 색상 매핑
export const STATUS_COLORS = {
  at_home: '#90EE90',        // 연두색 - 집에 있음
  out_with_destination: '#FF0000',     // 빨간색 - 목적지 설정하고 외출
  out_without_destination: '#808080',  // 회색 - 목적지 없이 이동
} as const;

// 상태별 텍스트 매핑
export const STATUS_TEXT = {
  at_home: '집에 있음',
  out_with_destination: '외출(이동 중)',
  out_without_destination: '이동 중',
} as const;

// 낙상 감지 알림 인터페이스
export interface FallAlert {
  id: string;
  dependentId: string;
  dependentName: string;
  location: Location;
  timestamp: Date;
  isHandled: boolean;
}

// 지도 검색 결과 인터페이스
export interface SearchResult {
  id: string;
  placeName: string;
  address: string;
  location: Location;
}

// 장소 상세 정보 인터페이스
export interface PlaceDetail {
  id: string;
  placeName: string;
  address: string;
  roadAddress?: string;
  category: string;
  phone?: string;
  openingHours?: string;
  url?: string;
  location: Location;
  rating?: number;
  reviewCount?: number;
}
