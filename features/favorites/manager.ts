import * as SecureStore from 'expo-secure-store';

/**
 * 즐겨찾기 항목 타입
 */
export interface FavoriteItem {
  /** 고유 ID */
  id: string;
  /** 시작 장소 */
  from: string;
  /** 도착 장소 */
  to: string;
  /** 생성 날짜 */
  createdAt: Date;
  /** 마지막 사용 날짜 */
  lastUsedAt?: Date;
  /** 사용 횟수 */
  usageCount: number;
  /** 사용자 지정 별칭 */
  alias?: string;
  /** 추가 메타데이터 */
  metadata?: {
    /** 시작 좌표 */
    fromCoords?: { lat: number; lng: number };
    /** 도착 좌표 */
    toCoords?: { lat: number; lng: number };
    /** 예상 소요 시간 (분) */
    estimatedTime?: number;
    /** 거리 (미터) */
    distance?: number;
    /** 선호 교통수단 */
    preferredTransport?: 'walk' | 'car' | 'public';
  };
}

/**
 * 즐겨찾기 옵션
 */
export interface FavoritesOptions {
  /** 최대 즐겨찾기 개수 */
  maxFavorites?: number;
  /** 자동 정렬 활성화 */
  autoSort?: boolean;
  /** 정렬 기준 */
  sortBy?: 'recent' | 'usage' | 'alphabetical' | 'created';
  /** 자동 백업 활성화 */
  autoBackup?: boolean;
}

/**
 * 즐겨찾기 이벤트 리스너
 */
export type FavoritesEventListener = {
  onFavoriteAdded?: (item: FavoriteItem) => void;
  onFavoriteRemoved?: (id: string) => void;
  onFavoriteUpdated?: (item: FavoriteItem) => void;
  onFavoritesCleared?: () => void;
  onFavoriteUsed?: (item: FavoriteItem) => void;
};

/**
 * 즐겨찾기 관리 클래스
 * 즐겨찾기 경로 저장, 관리, 정렬 등을 담당
 */
export class FavoritesManager {
  private static readonly STORAGE_KEY = 'user_favorites';
  private favorites: FavoriteItem[] = [];
  private options: Required<FavoritesOptions>;
  private listeners: FavoritesEventListener = {};
  private isLoaded = false;

  constructor(options: FavoritesOptions = {}) {
    this.options = {
      maxFavorites: options.maxFavorites ?? 20,
      autoSort: options.autoSort ?? true,
      sortBy: options.sortBy ?? 'recent',
      autoBackup: options.autoBackup ?? true,
    };
  }

  /**
   * 즐겨찾기 데이터 로드
   */
  async loadFavorites(): Promise<void> {
    try {
      const stored = await SecureStore.getItemAsync(FavoritesManager.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.favorites = parsed.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          lastUsedAt: item.lastUsedAt ? new Date(item.lastUsedAt) : undefined,
        }));
        
        if (this.options.autoSort) {
          this.sortFavorites();
        }
      }
      this.isLoaded = true;
      console.log(`즐겨찾기 ${this.favorites.length}개 로드됨`);
    } catch (error) {
      console.error('즐겨찾기 로드 실패:', error);
      this.favorites = [];
      this.isLoaded = true;
    }
  }

  /**
   * 즐겨찾기 데이터 저장
   */
  private async saveFavorites(): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        FavoritesManager.STORAGE_KEY,
        JSON.stringify(this.favorites)
      );
      
      if (this.options.autoBackup) {
        // TODO: 클라우드 백업 구현
        console.log('즐겨찾기 로컬 저장 완료');
      }
    } catch (error) {
      console.error('즐겨찾기 저장 실패:', error);
      throw new Error('즐겨찾기를 저장할 수 없습니다.');
    }
  }

  /**
   * 이벤트 리스너 등록
   */
  setEventListeners(listeners: FavoritesEventListener): void {
    this.listeners = { ...this.listeners, ...listeners };
  }

  /**
   * 즐겨찾기 추가
   */
  async addFavorite(from: string, to: string, alias?: string): Promise<FavoriteItem> {
    if (!this.isLoaded) {
      await this.loadFavorites();
    }

    // 중복 체크
    const existing = this.favorites.find(
      item => item.from === from && item.to === to
    );
    
    if (existing) {
      // 기존 항목 사용 횟수 증가
      return this.useFavorite(existing.id);
    }

    // 최대 개수 체크
    if (this.favorites.length >= this.options.maxFavorites) {
      // 가장 오래되거나 적게 사용된 항목 제거
      const leastUsed = this.favorites.reduce((min, item) => 
        item.usageCount < min.usageCount ? item : min
      );
      await this.removeFavorite(leastUsed.id);
    }

    const newFavorite: FavoriteItem = {
      id: this.generateId(),
      from,
      to,
      createdAt: new Date(),
      usageCount: 1,
      alias,
    };

    this.favorites.push(newFavorite);
    
    if (this.options.autoSort) {
      this.sortFavorites();
    }

    await this.saveFavorites();
    this.listeners.onFavoriteAdded?.(newFavorite);
    
    console.log(`즐겨찾기 추가: ${from} → ${to}`);
    return newFavorite;
  }

  /**
   * 즐겨찾기 제거
   */
  async removeFavorite(id: string): Promise<boolean> {
    if (!this.isLoaded) {
      await this.loadFavorites();
    }

    const index = this.favorites.findIndex(item => item.id === id);
    if (index === -1) {
      return false;
    }

    this.favorites.splice(index, 1);
    await this.saveFavorites();
    this.listeners.onFavoriteRemoved?.(id);
    
    console.log(`즐겨찾기 제거: ${id}`);
    return true;
  }

  /**
   * 즐겨찾기 사용 (사용 횟수 증가)
   */
  async useFavorite(id: string): Promise<FavoriteItem> {
    if (!this.isLoaded) {
      await this.loadFavorites();
    }

    const favorite = this.favorites.find(item => item.id === id);
    if (!favorite) {
      throw new Error('즐겨찾기를 찾을 수 없습니다.');
    }

    favorite.usageCount++;
    favorite.lastUsedAt = new Date();

    if (this.options.autoSort) {
      this.sortFavorites();
    }

    await this.saveFavorites();
    this.listeners.onFavoriteUsed?.(favorite);
    
    console.log(`즐겨찾기 사용: ${favorite.from} → ${favorite.to} (${favorite.usageCount}회)`);
    return favorite;
  }

  /**
   * 즐겨찾기 업데이트
   */
  async updateFavorite(id: string, updates: Partial<FavoriteItem>): Promise<FavoriteItem | null> {
    if (!this.isLoaded) {
      await this.loadFavorites();
    }

    const favorite = this.favorites.find(item => item.id === id);
    if (!favorite) {
      return null;
    }

    // ID와 생성일은 변경 불가
    const { id: _, createdAt: __, ...allowedUpdates } = updates;
    Object.assign(favorite, allowedUpdates);

    await this.saveFavorites();
    this.listeners.onFavoriteUpdated?.(favorite);
    
    return favorite;
  }

  /**
   * 모든 즐겨찾기 조회
   */
  async getFavorites(): Promise<FavoriteItem[]> {
    if (!this.isLoaded) {
      await this.loadFavorites();
    }
    return [...this.favorites];
  }

  /**
   * 특정 즐겨찾기 조회
   */
  async getFavorite(id: string): Promise<FavoriteItem | null> {
    if (!this.isLoaded) {
      await this.loadFavorites();
    }
    return this.favorites.find(item => item.id === id) || null;
  }

  /**
   * 즐겨찾기 검색
   */
  async searchFavorites(query: string): Promise<FavoriteItem[]> {
    if (!this.isLoaded) {
      await this.loadFavorites();
    }

    const lowerQuery = query.toLowerCase();
    return this.favorites.filter(item =>
      item.from.toLowerCase().includes(lowerQuery) ||
      item.to.toLowerCase().includes(lowerQuery) ||
      (item.alias && item.alias.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * 즐겨찾기 정렬
   */
  private sortFavorites(): void {
    switch (this.options.sortBy) {
      case 'recent':
        this.favorites.sort((a, b) => {
          const aTime = a.lastUsedAt || a.createdAt;
          const bTime = b.lastUsedAt || b.createdAt;
          return bTime.getTime() - aTime.getTime();
        });
        break;
      case 'usage':
        this.favorites.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case 'alphabetical':
        this.favorites.sort((a, b) => a.from.localeCompare(b.from, 'ko'));
        break;
      case 'created':
        this.favorites.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
    }
  }

  /**
   * 정렬 기준 변경
   */
  async setSortBy(sortBy: FavoritesOptions['sortBy']): Promise<void> {
    if (sortBy) {
      this.options.sortBy = sortBy;
      this.sortFavorites();
      await this.saveFavorites();
    }
  }

  /**
   * 모든 즐겨찾기 삭제
   */
  async clearAllFavorites(): Promise<void> {
    this.favorites = [];
    await this.saveFavorites();
    this.listeners.onFavoritesCleared?.();
    console.log('모든 즐겨찾기 삭제됨');
  }

  /**
   * 즐겨찾기 내보내기 (백업)
   */
  async exportFavorites(): Promise<string> {
    if (!this.isLoaded) {
      await this.loadFavorites();
    }

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      favorites: this.favorites,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 즐겨찾기 가져오기 (복원)
   */
  async importFavorites(jsonData: string, merge: boolean = false): Promise<void> {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.favorites || !Array.isArray(importData.favorites)) {
        throw new Error('유효하지 않은 즐겨찾기 데이터입니다.');
      }

      const importedFavorites: FavoriteItem[] = importData.favorites.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        lastUsedAt: item.lastUsedAt ? new Date(item.lastUsedAt) : undefined,
      }));

      if (merge) {
        // 기존 즐겨찾기와 병합 (중복 제거)
        for (const importedItem of importedFavorites) {
          const exists = this.favorites.some(
            existing => existing.from === importedItem.from && existing.to === importedItem.to
          );
          
          if (!exists) {
            importedItem.id = this.generateId(); // 새 ID 생성
            this.favorites.push(importedItem);
          }
        }
      } else {
        // 기존 즐겨찾기 교체
        this.favorites = importedFavorites;
      }

      if (this.options.autoSort) {
        this.sortFavorites();
      }

      await this.saveFavorites();
      console.log(`즐겨찾기 가져오기 완료: ${importedFavorites.length}개`);
    } catch (error) {
      console.error('즐겨찾기 가져오기 실패:', error);
      throw new Error('즐겨찾기 데이터를 가져올 수 없습니다.');
    }
  }

  /**
   * 통계 정보 조회
   */
  async getStatistics(): Promise<{
    totalFavorites: number;
    totalUsage: number;
    mostUsed: FavoriteItem | null;
    recentlyAdded: FavoriteItem | null;
    averageUsage: number;
  }> {
    if (!this.isLoaded) {
      await this.loadFavorites();
    }

    const totalUsage = this.favorites.reduce((sum, item) => sum + item.usageCount, 0);
    const mostUsed = this.favorites.reduce((max, item) => 
      item.usageCount > (max?.usageCount || 0) ? item : max, null as FavoriteItem | null
    );
    const recentlyAdded = this.favorites.reduce((recent, item) =>
      item.createdAt > (recent?.createdAt || new Date(0)) ? item : recent, null as FavoriteItem | null
    );

    return {
      totalFavorites: this.favorites.length,
      totalUsage,
      mostUsed,
      recentlyAdded,
      averageUsage: this.favorites.length > 0 ? totalUsage / this.favorites.length : 0,
    };
  }

  /**
   * 고유 ID 생성
   */
  private generateId(): string {
    return `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 설정 업데이트
   */
  updateOptions(newOptions: Partial<FavoritesOptions>): void {
    this.options = { ...this.options, ...newOptions };
    
    if (newOptions.sortBy && this.isLoaded) {
      this.sortFavorites();
      this.saveFavorites();
    }
  }

  /**
   * 리소스 정리
   */
  cleanup(): void {
    this.listeners = {};
  }
}

/**
 * 즐겨찾기 유틸리티 함수들
 */
export class FavoritesUtils {
  /**
   * 즐겨찾기 항목을 표시용 문자열로 변환
   */
  static formatFavoriteItem(item: FavoriteItem): string {
    const alias = item.alias ? ` (${item.alias})` : '';
    return `${item.from} → ${item.to}${alias}`;
  }

  /**
   * 사용 빈도 기반 표시 색상 반환
   */
  static getUsageColor(usageCount: number): string {
    if (usageCount >= 10) return '#FF6B6B'; // 빨간색 (매우 자주 사용)
    if (usageCount >= 5) return '#FFD93D'; // 노란색 (자주 사용)
    if (usageCount >= 2) return '#6BCF7F'; // 녹색 (보통 사용)
    return '#74B9FF'; // 파란색 (가끔 사용)
  }

  /**
   * 마지막 사용 시간 포맷팅
   */
  static formatLastUsed(lastUsedAt?: Date): string {
    if (!lastUsedAt) return '사용한 적 없음';
    
    const now = new Date();
    const diffMs = now.getTime() - lastUsedAt.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) return `${diffDays}일 전`;
    if (diffHours > 0) return `${diffHours}시간 전`;
    if (diffMinutes > 0) return `${diffMinutes}분 전`;
    return '방금 전';
  }

  /**
   * 즐겨찾기 유효성 검사
   */
  static validateFavoriteItem(item: Partial<FavoriteItem>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!item.from || item.from.trim().length === 0) {
      errors.push('시작 위치가 필요합니다.');
    }

    if (!item.to || item.to.trim().length === 0) {
      errors.push('도착 위치가 필요합니다.');
    }

    if (item.from === item.to) {
      errors.push('시작 위치와 도착 위치가 같을 수 없습니다.');
    }

    if (item.alias && item.alias.length > 50) {
      errors.push('별칭은 50자 이하여야 합니다.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * 전역 즐겨찾기 관리자 인스턴스
 */
export const favoritesManager = new FavoritesManager(); 