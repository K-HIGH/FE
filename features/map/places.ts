/**
 * 장소 정보 타입
 */
export interface PlaceInfo {
  /** 장소명 */
  name: string;
  /** 카테고리 */
  category: string;
  /** 평점 */
  rating: number;
  /** 주소 */
  address: string;
  /** 도로명 주소 */
  roadAddress?: string;
  /** 전화번호 */
  phone: string;
  /** 운영시간 */
  hours: string;
  /** 설명 */
  description: string;
  /** 좌표 */
  coordinates: {
    lat: number;
    lng: number;
  };
  /** 웹사이트 URL */
  website?: string;
  /** 이미지 URL들 */
  images?: string[];
  /** 추가 정보 */
  additionalInfo?: Record<string, any>;
}

/**
 * 장소 액션 타입
 */
export interface PlaceAction {
  type: 'call' | 'navigate' | 'share' | 'bookmark' | 'review';
  label: string;
  icon?: string;
  enabled: boolean;
}

/**
 * 장소 정보 옵션
 */
export interface PlaceInfoOptions {
  /** 기본 평점 */
  defaultRating?: number;
  /** 기본 전화번호 */
  defaultPhone?: string;
  /** 기본 운영시간 */
  defaultHours?: string;
  /** 추가 액션들 */
  customActions?: PlaceAction[];
}

/**
 * 장소 정보 이벤트 리스너
 */
export type PlaceInfoEventListener = {
  onPlaceSelected?: (place: PlaceInfo) => void;
  onPlaceInfoShow?: (place: PlaceInfo) => void;
  onPlaceInfoHide?: () => void;
  onActionClick?: (action: PlaceAction, place: PlaceInfo) => void;
};

/**
 * 장소 정보 관리 클래스
 * 장소 상세 정보 표시, 액션 처리, 북마크 등을 관리
 */
export class PlaceInfoManager {
  private currentPlace: PlaceInfo | null = null;
  private isVisible = false;
  private options: Required<PlaceInfoOptions>;
  private listeners: PlaceInfoEventListener = {};
  private defaultActions: PlaceAction[] = [
    {
      type: 'navigate',
      label: '길찾기',
      icon: '🗺️',
      enabled: true,
    },
    {
      type: 'call',
      label: '전화걸기',
      icon: '📞',
      enabled: true,
    },
    {
      type: 'share',
      label: '공유하기',
      icon: '📤',
      enabled: true,
    },
    {
      type: 'bookmark',
      label: '즐겨찾기',
      icon: '⭐',
      enabled: true,
    },
  ];

  constructor(options: PlaceInfoOptions = {}) {
    this.options = {
      defaultRating: options.defaultRating ?? 4.0,
      defaultPhone: options.defaultPhone ?? '02-1234-5678',
      defaultHours: options.defaultHours ?? '09:00 - 18:00',
      customActions: options.customActions ?? [],
    };
  }

  /**
   * 이벤트 리스너 등록
   */
  setEventListeners(listeners: PlaceInfoEventListener): void {
    this.listeners = { ...this.listeners, ...listeners };
  }

  /**
   * 검색 결과를 장소 정보로 변환
   */
  createPlaceFromSearchResult(searchResult: {
    location: string;
    lat: number;
    lng: number;
    address?: string;
    roadAddress?: string;
    placeType?: string;
  }): PlaceInfo {
    const place: PlaceInfo = {
      name: searchResult.location,
      category: searchResult.placeType || '장소',
      rating: this.options.defaultRating,
      address: searchResult.roadAddress || searchResult.address || '',
      roadAddress: searchResult.roadAddress,
      phone: this.options.defaultPhone,
      hours: this.options.defaultHours,
      description: `${searchResult.location}에 대한 상세 정보입니다.`,
      coordinates: {
        lat: searchResult.lat,
        lng: searchResult.lng,
      },
    };

    return place;
  }

  /**
   * 장소 정보 표시
   */
  showPlaceInfo(place: PlaceInfo): void {
    this.currentPlace = place;
    this.isVisible = true;
    this.listeners.onPlaceSelected?.(place);
    this.listeners.onPlaceInfoShow?.(place);
  }

  /**
   * 장소 정보 숨기기
   */
  hidePlaceInfo(): void {
    this.currentPlace = null;
    this.isVisible = false;
    this.listeners.onPlaceInfoHide?.();
  }

  /**
   * 현재 표시된 장소 정보 반환
   */
  getCurrentPlace(): PlaceInfo | null {
    return this.currentPlace;
  }

  /**
   * 장소 정보 표시 여부 반환
   */
  isPlaceInfoVisible(): boolean {
    return this.isVisible;
  }

  /**
   * 사용 가능한 액션들 반환
   */
  getAvailableActions(): PlaceAction[] {
    return [...this.defaultActions, ...this.options.customActions];
  }

  /**
   * 액션 실행 처리
   */
  handleActionClick(action: PlaceAction): void {
    if (!this.currentPlace) {
      console.warn('현재 선택된 장소가 없습니다.');
      return;
    }

    this.listeners.onActionClick?.(action, this.currentPlace);

    // 기본 액션 처리
    switch (action.type) {
      case 'call':
        this.handleCallAction(this.currentPlace);
        break;
      case 'navigate':
        this.handleNavigateAction(this.currentPlace);
        break;
      case 'share':
        this.handleShareAction(this.currentPlace);
        break;
      case 'bookmark':
        this.handleBookmarkAction(this.currentPlace);
        break;
      default:
        console.log(`커스텀 액션 처리 필요: ${action.type}`);
    }
  }

  /**
   * 전화걸기 액션 처리
   */
  private handleCallAction(place: PlaceInfo): void {
    if (place.phone) {
      // React Native Linking API 사용 예정
      console.log(`전화걸기: ${place.phone}`);
      // Linking.openURL(`tel:${place.phone}`);
    }
  }

  /**
   * 길찾기 액션 처리
   */
  private handleNavigateAction(place: PlaceInfo): void {
    console.log(`길찾기: ${place.name} (${place.coordinates.lat}, ${place.coordinates.lng})`);
    // 카카오맵 또는 네이티브 지도 앱으로 길찾기 실행
  }

  /**
   * 공유하기 액션 처리
   */
  private handleShareAction(place: PlaceInfo): void {
    const shareText = `${place.name}\n${place.address}\n${place.phone}`;
    console.log(`공유하기: ${shareText}`);
    // React Native Share API 사용 예정
  }

  /**
   * 즐겨찾기 액션 처리
   */
  private handleBookmarkAction(place: PlaceInfo): void {
    console.log(`즐겨찾기 추가: ${place.name}`);
    // 즐겨찾기 매니저에 추가 로직 연동 예정
  }

  /**
   * 장소 정보 업데이트
   */
  updatePlaceInfo(updates: Partial<PlaceInfo>): void {
    if (this.currentPlace) {
      this.currentPlace = { ...this.currentPlace, ...updates };
      this.listeners.onPlaceSelected?.(this.currentPlace);
    }
  }

  /**
   * 장소 정보 유효성 검사
   */
  validatePlaceInfo(place: PlaceInfo): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!place.name || place.name.trim().length === 0) {
      errors.push('장소명이 필요합니다.');
    }

    if (!place.coordinates || 
        typeof place.coordinates.lat !== 'number' || 
        typeof place.coordinates.lng !== 'number') {
      errors.push('유효한 좌표가 필요합니다.');
    }

    if (place.rating < 0 || place.rating > 5) {
      errors.push('평점은 0-5 사이의 값이어야 합니다.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 장소 정보를 문자열로 포맷팅
   */
  formatPlaceInfo(place: PlaceInfo): string {
    return `
📍 ${place.name}
🏷️ ${place.category}
⭐ ${place.rating}
📍 ${place.address}
📞 ${place.phone}
🕒 ${place.hours}
📝 ${place.description}
    `.trim();
  }

  /**
   * 설정 업데이트
   */
  updateOptions(newOptions: Partial<PlaceInfoOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * 리소스 정리
   */
  cleanup(): void {
    this.currentPlace = null;
    this.isVisible = false;
    this.listeners = {};
  }
}

/**
 * 장소 정보 유틸리티 함수들
 */
export class PlaceInfoUtils {
  /**
   * 평점을 별 문자열로 변환
   */
  static formatRating(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return '⭐'.repeat(fullStars) + 
           (hasHalfStar ? '🌟' : '') + 
           '☆'.repeat(emptyStars);
  }

  /**
   * 전화번호 포맷팅
   */
  static formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    return phone;
  }

  /**
   * 주소 단축
   */
  static shortenAddress(address: string, maxLength: number = 30): string {
    if (address.length <= maxLength) return address;
    
    return address.substring(0, maxLength - 3) + '...';
  }

  /**
   * 카테고리 아이콘 반환
   */
  static getCategoryIcon(category: string): string {
    const categoryIcons: Record<string, string> = {
      '음식점': '🍽️',
      '카페': '☕',
      '편의점': '🏪',
      '병원': '🏥',
      '약국': '💊',
      '은행': '🏦',
      '학교': '🏫',
      '지하철역': '🚇',
      '버스정류장': '🚌',
      '주차장': '🅿️',
      '공원': '🌳',
      '마트': '🛒',
      '쇼핑몰': '🛍️',
      '호텔': '🏨',
      '관광지': '🗺️',
    };

    return categoryIcons[category] || '📍';
  }

  /**
   * 운영시간 파싱 및 현재 운영 상태 확인
   */
  static isCurrentlyOpen(hours: string): { isOpen: boolean; status: string } {
    // 간단한 운영시간 파싱 (실제로는 더 복잡한 로직 필요)
    const now = new Date();
    const currentHour = now.getHours();
    
    // "09:00 - 18:00" 형태의 시간 파싱
    const timeMatch = hours.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    
    if (timeMatch) {
      const openHour = parseInt(timeMatch[1]);
      const closeHour = parseInt(timeMatch[3]);
      
      const isOpen = currentHour >= openHour && currentHour < closeHour;
      
      return {
        isOpen,
        status: isOpen ? '영업 중' : '영업 종료',
      };
    }
    
    return {
      isOpen: true,
      status: '운영시간 확인 필요',
    };
  }
}

/**
 * 전역 장소 정보 관리자 인스턴스
 */
export const placeInfoManager = new PlaceInfoManager(); 