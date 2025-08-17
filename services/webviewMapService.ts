import { WebView } from 'react-native-webview';

/**
 * WebView 메시지 타입 정의
 */
export interface WebViewMessage {
  type: 'MAP_LOADED' | 'SEARCH_SUCCESS' | 'PLACES_SEARCH_SUCCESS' | 'PLACES_SEARCH_FAILED' | 'SEARCH_FAILED' | 'MAPS_NOT_LOADED' | 'SEARCH_ERROR';
  location?: string;
  lat?: number;
  lng?: number;
  address?: string;
  roadAddress?: string;
  placeType?: string;
  places?: Array<{ place_name: string }>;
  searchText?: string;
  message?: string;
}

/**
 * WebView 메시지 핸들러 타입
 */
export type WebViewMessageHandler = (message: WebViewMessage) => void;

/**
 * 카카오맵 WebView 통신 서비스
 * WebView와 React Native 간의 메시지 통신을 관리
 */
export class WebViewMapService {
  private webViewRef: React.RefObject<WebView | null> | null = null;
  private messageHandlers: Map<string, WebViewMessageHandler> = new Map();

  /**
   * WebView 참조 설정
   */
  setWebViewRef(ref: React.RefObject<WebView | null>): void {
    this.webViewRef = ref;
  }

  /**
   * 메시지 핸들러 등록
   */
  addMessageHandler(id: string, handler: WebViewMessageHandler): void {
    this.messageHandlers.set(id, handler);
  }

  /**
   * 메시지 핸들러 제거
   */
  removeMessageHandler(id: string): void {
    this.messageHandlers.delete(id);
  }

  /**
   * WebView 메시지 처리
   */
  handleWebViewMessage = (event: any): void => {
    try {
      const data: WebViewMessage = JSON.parse(event.nativeEvent.data);
      
      // 모든 등록된 핸들러에 메시지 전달
      this.messageHandlers.forEach(handler => {
        handler(data);
      });
    } catch (error) {
      console.log('WebView message parsing failed:', event.nativeEvent.data);
    }
  };

  /**
   * WebView에 JavaScript 명령 실행
   */
  executeScript(script: string): void {
    if (this.webViewRef?.current) {
      this.webViewRef.current.injectJavaScript(script);
    } else {
      console.warn('WebView 참조가 설정되지 않았습니다.');
    }
  }

  /**
   * 장소 검색 실행
   */
  searchLocation(searchText: string): void {
    const searchCommand = `
      (function() {
        try {
          if (window.searchLocation) {
            window.searchLocation('${searchText}');
          } else if (window.searchPlaces) {
            window.searchPlaces('${searchText}');
          } else {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'SEARCH_ERROR',
                message: '검색 기능이 로드되지 않았습니다. 잠시 후 다시 시도해주세요.'
              }));
            }
          }
        } catch (error) {
          console.error('Search error:', error);
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'SEARCH_ERROR',
              message: '검색 중 오류가 발생했습니다.'
            }));
          }
        }
      })();
    `;
    
    this.executeScript(searchCommand);
  }

  /**
   * 연관검색어 가져오기
   */
  getSearchSuggestions(searchText: string): void {
    const searchCommand = `
      (function() {
        try {
          if (window.searchPlaces) {
            window.searchPlaces('${searchText}');
          } else if (window.searchLocation) {
            window.searchLocation('${searchText}');
          } else {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'SEARCH_ERROR',
                message: '검색 기능이 로드되지 않았습니다. 잠시 후 다시 시도해주세요.'
              }));
            }
          }
        } catch (error) {
          console.error('Search error:', error);
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'SEARCH_ERROR',
              message: '검색 중 오류가 발생했습니다.'
            }));
          }
        }
      })();
    `;
    
    this.executeScript(searchCommand);
  }

  /**
   * 현재 위치로 지도 이동
   */
  moveToCurrentLocation(): void {
    const moveCommand = `
      (function() {
        try {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              
              if (window.kakao && window.kakao.maps && window.map) {
                const coords = new window.kakao.maps.LatLng(lat, lng);
                window.map.setCenter(coords);
                window.map.setLevel(3);
                
                // 현재 위치 마커 표시
                const marker = new window.kakao.maps.Marker({
                  position: coords
                });
                marker.setMap(window.map);
                
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'CURRENT_LOCATION_SUCCESS',
                    lat: lat,
                    lng: lng
                  }));
                }
              }
            }, function(error) {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'CURRENT_LOCATION_ERROR',
                  message: '현재 위치를 가져올 수 없습니다.'
                }));
              }
            });
          }
        } catch (error) {
          console.error('Current location error:', error);
        }
      })();
    `;
    
    this.executeScript(moveCommand);
  }

  /**
   * 카카오맵 CSS 숨김 스크립트 생성
   */
  static getMapCSSHideScript(): string {
    return `
      (function() {
        const hideElements = () => {
          const selectors = [
            '.kakao-map-app-header',
            '.kakao-map-app-footer', 
            '.kakao-map-app-sidebar',
            '.kakao-map-app-popup',
            '.kakao-map-app-overlay',
            '.kakao-map-app-nav',
            '.kakao-map-app-toolbar',
            '[data-testid*="app"]',
            '[class*="app-header"]',
            '[class*="app-footer"]',
            '[class*="popup"]',
            '[class*="overlay"]',
            '[class*="toolbar"]',
            '[class*="navigation"]',
            '[class*="menu"]',
            '.map_control',
            '.map_control_zoom',
            '.map_control_scale',
            '.map_control_fullscreen',
            '.map_control_compass',
            '.map_control_geolocation',
            '[class*="control"]',
            '[class*="button"]:not([class*="map"])',
            '[class*="panel"]',
            '[class*="sidebar"]',
            '[class*="header"]',
            '[class*="footer"]'
          ];
          
          selectors.forEach(selector => {
            try {
              const elements = document.querySelectorAll(selector);
              elements.forEach(el => {
                if (el) {
                  el.style.display = 'none';
                  el.style.visibility = 'hidden';
                  el.style.opacity = '0';
                }
              });
            } catch (e) {
              // 선택자 오류 무시
            }
          });
          
          // 지도 컨테이너만 보이도록 강제 설정
          const mapSelectors = ['#map', '.map', '[class*="map"]', '[id*="map"]'];
          mapSelectors.forEach(selector => {
            try {
              const mapContainer = document.querySelector(selector);
              if (mapContainer) {
                mapContainer.style.width = '100% !important';
                mapContainer.style.height = '100% !important';
                mapContainer.style.position = 'absolute !important';
                mapContainer.style.top = '0 !important';
                mapContainer.style.left = '0 !important';
                mapContainer.style.zIndex = '1 !important';
              }
            } catch (e) {
              // 오류 무시
            }
          });
          
          // body와 html 스타일 강제 설정
          document.body.style.overflow = 'hidden';
          document.body.style.margin = '0';
          document.body.style.padding = '0';
          document.documentElement.style.overflow = 'hidden';
        };
        
        // 즉시 실행
        hideElements();
        
        // DOM 로드 후 실행
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', hideElements);
        }
        
        // 지연 실행 (동적 로딩 대응)
        setTimeout(hideElements, 100);
        setTimeout(hideElements, 500);
        setTimeout(hideElements, 1000);
        
        // MutationObserver로 동적 요소 감지
        const observer = new MutationObserver(hideElements);
        observer.observe(document.body, { 
          childList: true, 
          subtree: true,
          attributes: true,
          attributeFilter: ['style', 'class']
        });
      })();
    `;
  }

  /**
   * 카카오맵 검색 함수 등록 스크립트 생성
   */
  static getMapSearchFunctionsScript(): string {
    return `
      (function() {
        // 카카오맵 검색 함수 등록
        window.searchLocation = function(searchText) {
          try {
            console.log('searchLocation 호출됨:', searchText);
            
            if (window.kakao && window.kakao.maps) {
              const geocoder = new window.kakao.maps.services.Geocoder();
              geocoder.addressSearch(searchText, function(result, status) {
                console.log('주소 검색 결과:', result, status);
                
                if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
                  const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
                  
                  if (window.map) {
                    window.map.setCenter(coords);
                    window.map.setLevel(3);
                    
                    const marker = new window.kakao.maps.Marker({
                      position: coords
                    });
                    marker.setMap(window.map);
                    
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'SEARCH_SUCCESS',
                      location: searchText,
                      lat: result[0].y,
                      lng: result[0].x,
                      address: result[0].address.address_name,
                      roadAddress: result[0].address.road_address_name,
                      placeType: result[0].address.region_3depth_name || result[0].address.region_2depth_name
                    }));
                    
                    const suggestions = [
                      searchText,
                      searchText + ' 근처',
                      searchText + ' 주변',
                      searchText + ' 주변 편의시설'
                    ];
                    
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'PLACES_SEARCH_SUCCESS',
                      places: suggestions.map(s => ({ place_name: s })),
                      searchText: searchText
                    }));
                  }
                } else {
                  if (window.searchPlaces) {
                    window.searchPlaces(searchText);
                  } else {
                    const testSuggestions = [
                      searchText,
                      searchText + ' 근처',
                      searchText + ' 주변',
                      searchText + ' 주변 편의시설',
                      searchText + ' 주변 음식점',
                      searchText + ' 주변 카페'
                    ];
                    
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'PLACES_SEARCH_SUCCESS',
                      places: testSuggestions.map(s => ({ place_name: s })),
                      searchText: searchText
                    }));
                  }
                }
              });
            } else {
              console.error('카카오맵 API가 로드되지 않음');
              const testSuggestions = [
                searchText,
                searchText + ' 근처',
                searchText + ' 주변',
                searchText + ' 주변 편의시설',
                searchText + ' 주변 음식점',
                searchText + ' 주변 카페'
              ];
              
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'PLACES_SEARCH_SUCCESS',
                places: testSuggestions.map(s => ({ place_name: s })),
                searchText: searchText
              }));
            }
          } catch (error) {
            console.error('searchLocation 오류:', error);
            const testSuggestions = [
              searchText,
              searchText + ' 근처',
              searchText + ' 주변',
              searchText + ' 주변 편의시설'
            ];
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PLACES_SEARCH_SUCCESS',
              places: testSuggestions.map(s => ({ place_name: s })),
              searchText: searchText
            }));
          }
        };
        
        // 장소 검색 함수 등록 (키워드 검색)
        window.searchPlaces = function(searchText) {
          try {
            console.log('searchPlaces 호출됨:', searchText);
            
            if (window.kakao && window.kakao.maps) {
              const places = new window.kakao.maps.services.Places();
              places.keywordSearch(searchText, function(result, status) {
                console.log('키워드 검색 결과:', result, status);
                
                if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
                  const firstResult = result[0];
                  const coords = new window.kakao.maps.LatLng(firstResult.y, firstResult.x);
                  
                  if (window.searchMarkers) {
                    window.searchMarkers.forEach(marker => marker.setMap(null));
                  }
                  window.searchMarkers = [];
                  
                  if (window.map) {
                    window.map.setCenter(coords);
                    window.map.setLevel(3);
                    
                    const marker = new window.kakao.maps.Marker({
                      position: coords
                    });
                    marker.setMap(window.map);
                    window.searchMarkers.push(marker);
                    
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'SEARCH_SUCCESS',
                      location: firstResult.place_name,
                      lat: firstResult.y,
                      lng: firstResult.x,
                      address: firstResult.address_name,
                      roadAddress: firstResult.road_address_name,
                      placeType: firstResult.category_group_name || '장소'
                    }));
                    
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'PLACES_SEARCH_SUCCESS',
                      places: result.slice(0, 10),
                      searchText: searchText
                    }));
                  }
                } else {
                  const testSuggestions = [
                    searchText,
                    searchText + ' 근처',
                    searchText + ' 주변',
                    searchText + ' 주변 편의시설'
                  ];
                  
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'PLACES_SEARCH_SUCCESS',
                    places: testSuggestions.map(s => ({ place_name: s })),
                    searchText: searchText
                  }));
                }
              });
            } else {
              console.error('카카오맵 API가 로드되지 않음');
              const testSuggestions = [
                searchText,
                searchText + ' 근처',
                searchText + ' 주변',
                searchText + ' 주변 편의시설',
                searchText + ' 주변 음식점',
                searchText + ' 주변 카페'
              ];
              
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'PLACES_SEARCH_SUCCESS',
                places: testSuggestions.map(s => ({ place_name: s })),
                searchText: searchText
              }));
            }
          } catch (error) {
            console.error('searchPlaces 오류:', error);
            const testSuggestions = [
              searchText,
              searchText + ' 근처',
              searchText + ' 주변',
              searchText + ' 주변 편의시설'
            ];
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PLACES_SEARCH_SUCCESS',
              places: testSuggestions.map(s => ({ place_name: s })),
              searchText: searchText
            }));
          }
        };
      })();
    `;
  }

  /**
   * 완전한 카카오맵 초기화 스크립트 생성
   */
  static getCompleteMapInitScript(): string {
    return `
      ${this.getMapCSSHideScript()}
      ${this.getMapSearchFunctionsScript()}
    `;
  }
}

/**
 * 전역 WebView 맵 서비스 인스턴스
 */
export const webviewMapService = new WebViewMapService(); 