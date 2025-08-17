/**
 * 검색 상태 타입
 */
export type SearchStatus = 'idle' | 'searching' | 'success' | 'error';

/**
 * 검색 결과 타입
 */
export interface SearchResult {
  location: string;
  lat: number;
  lng: number;
  address?: string;
  roadAddress?: string;
  placeType?: string;
}

/**
 * 연관검색어 타입
 */
export interface SearchSuggestion {
  text: string;
  type: 'place' | 'keyword' | 'category';
}

/**
 * 검색 옵션
 */
export interface SearchOptions {
  /** 디바운싱 지연 시간 (밀리초) */
  debounceDelay?: number;
  /** 최대 연관검색어 개수 */
  maxSuggestions?: number;
  /** 자동 검색 활성화 여부 */
  autoSearch?: boolean;
}

/**
 * 검색 이벤트 리스너 타입
 */
export type SearchEventListener = {
  onSearchStart?: (query: string) => void;
  onSearchSuccess?: (result: SearchResult) => void;
  onSearchError?: (error: string) => void;
  onSuggestionsReceived?: (suggestions: SearchSuggestion[]) => void;
  onStatusChange?: (status: SearchStatus) => void;
};

/**
 * 장소 검색 관리 클래스
 * 디바운싱, 연관검색어, 검색 이력 등을 관리
 */
export class MapSearchManager {
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;
  private searchHistory: string[] = [];
  private recentSuggestions: SearchSuggestion[] = [];
  private currentStatus: SearchStatus = 'idle';
  private options: Required<SearchOptions>;
  private listeners: SearchEventListener = {};

  constructor(options: SearchOptions = {}) {
    this.options = {
      debounceDelay: options.debounceDelay ?? 200,
      maxSuggestions: options.maxSuggestions ?? 10,
      autoSearch: options.autoSearch ?? true,
    };
  }

  /**
   * 이벤트 리스너 등록
   */
  setEventListeners(listeners: SearchEventListener): void {
    this.listeners = { ...this.listeners, ...listeners };
  }

  /**
   * 검색 상태 변경
   */
  private setStatus(status: SearchStatus): void {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      this.listeners.onStatusChange?.(status);
    }
  }

  /**
   * 검색 실행 (디바운싱 적용)
   */
  searchWithDebounce(
    query: string,
    onSearch: (query: string) => void
  ): void {
    // 이전 타이머 취소
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    if (query.trim().length === 0) {
      this.clearSuggestions();
      return;
    }

    // 디바운싱 적용
    this.searchTimeout = setTimeout(() => {
      this.setStatus('searching');
      this.listeners.onSearchStart?.(query);
      onSearch(query);
    }, this.options.debounceDelay);
  }

  /**
   * 즉시 검색 실행
   */
  searchImmediate(
    query: string,
    onSearch: (query: string) => void
  ): void {
    if (query.trim().length === 0) return;

    this.setStatus('searching');
    this.listeners.onSearchStart?.(query);
    this.addToHistory(query);
    onSearch(query);
  }

  /**
   * 검색 성공 처리
   */
  handleSearchSuccess(result: SearchResult): void {
    this.setStatus('success');
    this.listeners.onSearchSuccess?.(result);
    this.addToHistory(result.location);
    
    // 검색 성공 후 3초 뒤 상태 초기화
    setTimeout(() => {
      if (this.currentStatus === 'success') {
        this.setStatus('idle');
      }
    }, 3000);
  }

  /**
   * 검색 실패 처리
   */
  handleSearchError(error: string): void {
    this.setStatus('error');
    this.listeners.onSearchError?.(error);
    
    // 검색 실패 후 3초 뒤 상태 초기화
    setTimeout(() => {
      if (this.currentStatus === 'error') {
        this.setStatus('idle');
      }
    }, 3000);
  }

  /**
   * 연관검색어 수신 처리
   */
  handleSuggestionsReceived(suggestions: SearchSuggestion[]): void {
    const limitedSuggestions = suggestions.slice(0, this.options.maxSuggestions);
    this.recentSuggestions = limitedSuggestions;
    this.listeners.onSuggestionsReceived?.(limitedSuggestions);
  }

  /**
   * 카카오맵 API 응답을 연관검색어로 변환
   */
  convertPlacesToSuggestions(places: Array<{ place_name: string }>): SearchSuggestion[] {
    return places.map(place => ({
      text: place.place_name,
      type: 'place' as const,
    }));
  }

  /**
   * 검색 이력에 추가
   */
  private addToHistory(query: string): void {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) return;

    // 중복 제거
    this.searchHistory = this.searchHistory.filter(item => item !== trimmedQuery);
    // 앞에 추가
    this.searchHistory.unshift(trimmedQuery);
    // 최대 20개까지만 유지
    this.searchHistory = this.searchHistory.slice(0, 20);
  }

  /**
   * 연관검색어 클리어
   */
  clearSuggestions(): void {
    this.recentSuggestions = [];
    this.listeners.onSuggestionsReceived?.([]);
  }

  /**
   * 검색 이력 기반 연관검색어 생성
   */
  getHistoryBasedSuggestions(query: string): SearchSuggestion[] {
    const filteredHistory = this.searchHistory
      .filter(item => item.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);

    return filteredHistory.map(item => ({
      text: item,
      type: 'keyword' as const,
    }));
  }

  /**
   * 기본 연관검색어 생성 (fallback)
   */
  generateFallbackSuggestions(query: string): SearchSuggestion[] {
    const fallbackSuggestions = [
      { text: query, type: 'keyword' as const },
      { text: `${query} 근처`, type: 'category' as const },
      { text: `${query} 주변`, type: 'category' as const },
      { text: `${query} 주변 편의시설`, type: 'category' as const },
      { text: `${query} 주변 음식점`, type: 'category' as const },
      { text: `${query} 주변 카페`, type: 'category' as const },
    ];

    return fallbackSuggestions.slice(0, this.options.maxSuggestions);
  }

  /**
   * 현재 검색 상태 반환
   */
  getStatus(): SearchStatus {
    return this.currentStatus;
  }

  /**
   * 검색 이력 반환
   */
  getSearchHistory(): string[] {
    return [...this.searchHistory];
  }

  /**
   * 최근 연관검색어 반환
   */
  getRecentSuggestions(): SearchSuggestion[] {
    return [...this.recentSuggestions];
  }

  /**
   * 검색 이력 클리어
   */
  clearHistory(): void {
    this.searchHistory = [];
  }

  /**
   * 검색 설정 업데이트
   */
  updateOptions(newOptions: Partial<SearchOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * 검색 상태 메시지 생성
   */
  getStatusMessage(): string {
    switch (this.currentStatus) {
      case 'searching':
        return '🔍 검색 중...';
      case 'success':
        return '✅ 검색 완료';
      case 'error':
        return '❌ 검색 실패';
      default:
        return '';
    }
  }

  /**
   * 리소스 정리
   */
  cleanup(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }
    this.listeners = {};
  }
}

/**
 * 검색 결과 유틸리티 함수들
 */
export class SearchResultUtils {
  /**
   * 검색 결과 유효성 검사
   */
  static isValidSearchResult(result: any): result is SearchResult {
    return (
      result &&
      typeof result.location === 'string' &&
      typeof result.lat === 'number' &&
      typeof result.lng === 'number' &&
      !isNaN(result.lat) &&
      !isNaN(result.lng)
    );
  }

  /**
   * 검색 결과를 지도용 데이터로 변환
   */
  static convertToMapData(result: SearchResult) {
    return {
      center: {
        lat: result.lat,
        lng: result.lng,
      },
      marker: {
        position: {
          lat: result.lat,
          lng: result.lng,
        },
        title: result.location,
      },
      info: {
        name: result.location,
        address: result.address || '',
        roadAddress: result.roadAddress || '',
        category: result.placeType || '장소',
      },
    };
  }

  /**
   * 검색 결과 거리 계산 (현재 위치 기준)
   */
  static calculateDistance(
    result: SearchResult,
    currentLat: number,
    currentLng: number
  ): number {
    const R = 6371000; // 지구 반지름 (미터)
    const lat1Rad = (currentLat * Math.PI) / 180;
    const lat2Rad = (result.lat * Math.PI) / 180;
    const deltaLat = ((result.lat - currentLat) * Math.PI) / 180;
    const deltaLon = ((result.lng - currentLng) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  /**
   * 거리를 사용자 친화적 문자열로 변환
   */
  static formatDistance(distanceInMeters: number): string {
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)}m`;
    } else {
      return `${(distanceInMeters / 1000).toFixed(1)}km`;
    }
  }
}

/**
 * 전역 검색 관리자 인스턴스
 */
export const mapSearchManager = new MapSearchManager(); 