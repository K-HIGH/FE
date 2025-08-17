import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

export default function SeniorHomeScreen() {
  const [searchText, setSearchText] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [showPlaceInfo, setShowPlaceInfo] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const webViewRef = useRef<WebView>(null);

  // 키보드 이벤트 리스너
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'MAP_LOADED':
          console.log('카카오맵이 로드되었습니다.');
          break;
        case 'SEARCH_SUCCESS':
          setSearchStatus(`✅ ${data.location} 위치를 찾았습니다.`);
          // 연관검색어 숨기기
          setShowSuggestions(false);
          // 실제 장소 정보 사용
          const placeInfo = {
            name: data.location,
            category: data.placeType || '장소',
            rating: 4.0, // 기본 평점
            address: data.roadAddress || data.address,
            phone: '02-1234-5678', // 기본 전화번호
            hours: '09:00 - 18:00', // 기본 운영시간
            description: `${data.location}에 대한 상세 정보입니다.`,
            coordinates: {
              lat: data.lat,
              lng: data.lng
            }
          };
          setSelectedPlace(placeInfo);
          setShowPlaceInfo(true);
          setTimeout(() => setSearchStatus(''), 3000);
          break;
        case 'PLACES_SEARCH_SUCCESS':
          // 실제 검색 결과를 연관검색어로 사용
          console.log('연관검색어 받음:', data.places);
          const suggestions = data.places.map((place: any) => place.place_name);
          console.log('처리된 연관검색어:', suggestions);
          setSearchSuggestions(suggestions);
          setShowSuggestions(true);
          break;
        case 'PLACES_SEARCH_FAILED':
          setSearchStatus(`❌ ${data.message}`);
          setTimeout(() => setSearchStatus(''), 3000);
          break;
        case 'SEARCH_FAILED':
          setSearchStatus(`❌ ${data.message}`);
          setTimeout(() => setSearchStatus(''), 3000);
          break;
        case 'MAPS_NOT_LOADED':
          setSearchStatus('⚠️ 카카오맵 API가 로드되지 않았습니다.');
          setTimeout(() => setSearchStatus(''), 3000);
          break;
        case 'SEARCH_ERROR':
          setSearchStatus(`❌ ${data.message}`);
          setTimeout(() => setSearchStatus(''), 3000);
          break;
        default:
          console.log('WebView message:', event.nativeEvent.data);
      }
    } catch (error) {
      console.log('WebView message:', event.nativeEvent.data);
    }
  };

  const handleSearchInput = (text: string) => {
    setSearchText(text);
    
    // 이전 타이머 취소
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (text.trim().length > 0) {
      // 200ms 후에 검색 실행 (디바운싱 시간 단축)
      const timeout = setTimeout(() => {
        // 실제 카카오맵 API를 사용하여 연관검색어 가져오기
        const searchCommand = `
          (function() {
            try {
              if (window.searchPlaces) {
                window.searchPlaces('${text}');
              } else if (window.searchLocation) {
                // searchPlaces가 없으면 searchLocation 사용
                window.searchLocation('${text}');
              } else {
                // 검색 함수가 아직 로드되지 않은 경우
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
        
        webViewRef.current?.injectJavaScript(searchCommand);
      }, 200); // 300ms에서 200ms로 단축
      
      setSearchTimeout(timeout);
    } else {
      setShowSuggestions(false);
      setSearchSuggestions([]);
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setSearchText(suggestion);
    setShowSuggestions(false);
    setSearchStatus(`🔍 ${suggestion} 검색 중...`);
    
    // WebView에 검색 명령 전달
    const searchCommand = `
      (function() {
        try {
          if (window.searchLocation) {
            window.searchLocation('${suggestion}');
          } else {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'SEARCH_ERROR',
                message: '검색 기능이 로드되지 않았습니다.'
              }));
            }
          }
        } catch (error) {
          console.error('Search error:', error);
        }
      })();
    `;
    
    webViewRef.current?.injectJavaScript(searchCommand);
  };

  const handleSearch = () => {
    if (searchText.trim()) {
      // Enter 키를 눌렀을 때 연관검색어 숨기기
      setShowSuggestions(false);
      setSearchStatus(`🔍 ${searchText} 검색 중...`);
      
      // WebView에 검색 명령 전달 (카카오맵 API 사용)
      const searchCommand = `
        (function() {
          try {
            // 카카오맵 검색 함수 호출 (주소 검색)
            if (window.searchLocation) {
              window.searchLocation('${searchText}');
            } else if (window.searchPlaces) {
              // searchLocation이 없으면 searchPlaces 사용
              window.searchPlaces('${searchText}');
            } else {
              // 검색 함수가 아직 로드되지 않은 경우
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
      
      webViewRef.current?.injectJavaScript(searchCommand);
    }
  };

  return (
    <View style={styles.container}>
      {/* 상단 지도 영역 */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: 'https://k-high.github.io/FE/map.html' }}
          style={{ flex: 1 }}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          onMessage={handleWebViewMessage}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          // 지도만 보이도록 CSS 주입
          injectedJavaScript={`
            (function() {
              // 카카오맵 앱 UI 요소들을 더 포괄적으로 숨기기
              const hideElements = () => {
                // 더 많은 선택자 추가
                const selectors = [
                  // 카카오맵 앱 관련
                  '.kakao-map-app-header',
                  '.kakao-map-app-footer', 
                  '.kakao-map-app-sidebar',
                  '.kakao-map-app-popup',
                  '.kakao-map-app-overlay',
                  '.kakao-map-app-nav',
                  '.kakao-map-app-toolbar',
                  // 일반적인 앱 UI 요소
                  '[data-testid*="app"]',
                  '[class*="app-header"]',
                  '[class*="app-footer"]',
                  '[class*="popup"]',
                  '[class*="overlay"]',
                  '[class*="toolbar"]',
                  '[class*="navigation"]',
                  '[class*="menu"]',
                  // 카카오맵 특정 요소들
                  '.map_control',
                  '.map_control_zoom',
                  '.map_control_scale',
                  '.map_control_fullscreen',
                  '.map_control_compass',
                  '.map_control_geolocation',
                  // 추가 UI 요소들
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
              
              // 카카오맵 검색 함수 등록
              window.searchLocation = function(searchText) {
                try {
                  console.log('searchLocation 호출됨:', searchText);
                  
                  // 카카오맵 API를 사용한 검색
                  if (window.kakao && window.kakao.maps) {
                    const geocoder = new window.kakao.maps.services.Geocoder();
                    geocoder.addressSearch(searchText, function(result, status) {
                      console.log('주소 검색 결과:', result, status);
                      
                      if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
                        const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
                        
                        // 지도 중심 이동
                        if (window.map) {
                          window.map.setCenter(coords);
                          window.map.setLevel(3);
                          
                          // 마커 추가
                          const marker = new window.kakao.maps.Marker({
                            position: coords
                          });
                          marker.setMap(window.map);
                          
                          // 검색 성공 알림
                          window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'SEARCH_SUCCESS',
                            location: searchText,
                            lat: result[0].y,
                            lng: result[0].x,
                            address: result[0].address.address_name,
                            roadAddress: result[0].address.road_address_name,
                            placeType: result[0].address.region_3depth_name || result[0].address.region_2depth_name
                          }));
                          
                          // 연관검색어 생성
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
                        // 주소 검색 실패 시 키워드 검색으로 대체
                        console.log('주소 검색 실패, 키워드 검색으로 대체');
                        if (window.searchPlaces) {
                          window.searchPlaces(searchText);
                        } else {
                          // 키워드 검색도 실패 시 테스트용 연관검색어 생성
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
                    // API가 로드되지 않은 경우 테스트용 연관검색어 생성
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
                  // 오류 발생 시에도 테스트용 연관검색어 생성
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
                        
                        // 기존 마커 제거
                        if (window.searchMarkers) {
                          window.searchMarkers.forEach(marker => marker.setMap(null));
                        }
                        window.searchMarkers = [];
                        
                        // 지도 중심 이동
                        if (window.map) {
                          window.map.setCenter(coords);
                          window.map.setLevel(3);
                          
                          // 마커 추가
                          const marker = new window.kakao.maps.Marker({
                            position: coords
                          });
                          marker.setMap(window.map);
                          window.searchMarkers.push(marker);
                          
                          // 검색 성공 알림
                          window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'SEARCH_SUCCESS',
                            location: firstResult.place_name,
                            lat: firstResult.y,
                            lng: firstResult.x,
                            address: firstResult.address_name,
                            roadAddress: firstResult.road_address_name,
                            placeType: firstResult.category_group_name || '장소'
                          }));
                          
                          // 연관검색어로 검색 결과 전송
                          window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'PLACES_SEARCH_SUCCESS',
                            places: result.slice(0, 10),
                            searchText: searchText
                          }));
                        }
                      } else {
                        // 검색 실패 시에도 테스트용 연관검색어 생성
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
                    // API가 로드되지 않은 경우 테스트용 연관검색어 생성
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
                  // 오류 발생 시에도 테스트용 연관검색어 생성
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
          `}
        />
        
        {/* 검색창을 지도 위에 오버레이로 배치 */}
        <View style={[
          styles.searchContainer,
          isKeyboardVisible && styles.searchContainerKeyboardVisible
        ]}>
          <TextInput
            style={styles.searchInput}
            placeholder="위치 검색"
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={handleSearchInput}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            blurOnSubmit={false}
          />
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>✎</Text>
          </TouchableOpacity>
        </View>

        {/* 연관검색어 표시 */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <ScrollView
            style={[
              styles.suggestionsContainer,
              isKeyboardVisible && styles.suggestionsContainerKeyboardVisible
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {searchSuggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => handleSuggestionSelect(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* 장소 정보 표시 */}
        {showPlaceInfo && selectedPlace && (
          <View style={styles.placeInfoContainer}>
            <View style={styles.placeInfoHeader}>
              <Text style={styles.placeInfoTitle}>{selectedPlace.name}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowPlaceInfo(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.placeInfoCategory}>{selectedPlace.category}</Text>
            
            <View style={styles.placeInfoRating}>
              <Text style={styles.ratingText}>⭐ {selectedPlace.rating}</Text>
            </View>
            
            <View style={styles.placeInfoDetail}>
              <Text style={styles.detailLabel}>📍 주소</Text>
              <Text style={styles.detailText}>{selectedPlace.address}</Text>
            </View>
            
            <View style={styles.placeInfoDetail}>
              <Text style={styles.detailLabel}>📞 전화</Text>
              <Text style={styles.detailText}>{selectedPlace.phone}</Text>
            </View>
            
            <View style={styles.placeInfoDetail}>
              <Text style={styles.detailLabel}>🕒 운영시간</Text>
              <Text style={styles.detailText}>{selectedPlace.hours}</Text>
            </View>
            
            <View style={styles.placeInfoActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>길찾기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>전화걸기</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={() => {
            Alert.alert('현위치 이동', '현재 위치로 지도를 이동합니다.');
            // WebView에 postMessage로 전달 가능 (후처리 필요 시)
          }}
        >
          <Text style={styles.buttonText}>현위치</Text>
        </TouchableOpacity>
      </View>

      {/* 하단 UI */}
      <View style={styles.bottomContainer}>
        {/* 검색 상태 표시 */}
        {searchStatus ? (
          <View style={styles.searchStatusContainer}>
            <Text style={styles.searchStatusText}>{searchStatus}</Text>
          </View>
        ) : null}

        {/* 즐겨찾기 */}
        <View style={styles.favoritesHeader}>
          <Text style={styles.sectionTitle}>즐겨찾기</Text>
          <Text style={styles.editButtonText}>수정</Text>
        </View>
        <ScrollView style={styles.favoritesContainer}>
          <TouchableOpacity onPress={() => Alert.alert('이동', '우리집 → 서울대학교병원')}>
            <Text style={styles.favoriteItem}>우리집 → 서울대학교병원</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('이동', '하나로마트성수점 → 우리집')}>
            <Text style={styles.favoriteItem}>하나로마트성수점 → 우리집</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('이동', '교회 → 서울대학교병원')}>
            <Text style={styles.favoriteItem}>교회 → 서울대학교병원</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 하단 버튼 */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>보호인 목록</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>설정</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  mapContainer: { flex: 0.65, position: 'relative' }, // 지도 비율을 0.65로 감소
  currentLocationButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#90ee90',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  buttonText: { color: '#000', fontSize: 15, fontWeight: 'bold' },
  bottomContainer: {
    flex: 0.35, // 하단 컨테이너 비율을 0.35로 증가
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  searchContainer: {
    position: 'absolute', // 절대 위치로 변경
    bottom: 35, // 지도 하단에서 35px 위로 증가
    left: 20,
    right: 20,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 25, // 더 둥근 모서리
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12, // 세로 패딩 증가
    backgroundColor: '#ffffff', // 완전 불투명
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000, // 다른 요소들 위에 표시
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
    color: '#000',
    paddingHorizontal: 12, // 좌우 패딩 증가
  },
  editButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editButtonText: {
    fontSize: 16,
    color: '#666',
  },
  searchStatusContainer: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignSelf: 'center',
  },
  searchStatusText: {
    fontSize: 14,
    color: '#333',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 100, // 검색창 아래에 배치
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 999,
    maxHeight: 200, // 최대 높이 제한
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: 15,
    color: '#333',
  },
  placeInfoContainer: {
    position: 'absolute',
    top: 120, // 연관검색어 아래에 배치
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 998, // 연관검색어보다 낮은 z-index
    padding: 15,
  },
  placeInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  placeInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  placeInfoCategory: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  placeInfoRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ratingText: {
    fontSize: 16,
    color: '#f39c12',
  },
  placeInfoDetail: {
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: '#777',
    marginBottom: 2,
  },
  detailText: {
    fontSize: 15,
    color: '#333',
  },
  placeInfoActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  favoritesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  favoritesContainer: {
    flex: 1,
    marginBottom: 12,
  },
  favoriteItem: {
    fontSize: 16,
    paddingVertical: 4,
    color: '#222',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    backgroundColor: '#ddd',
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchContainerKeyboardVisible: {
    bottom: 150, // 키보드가 보일 때 검색창을 더 위로 이동
  },
  suggestionsContainerKeyboardVisible: {
    top: 200, // 키보드가 보일 때 연관검색어를 더 위로 이동
    maxHeight: 150, // 키보드가 보일 때는 높이 제한
  },
});
 