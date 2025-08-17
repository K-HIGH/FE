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

// 분리된 모듈들 import
import {
  FavoriteItem,
  favoritesManager,
  FavoritesUtils
} from '@/features/favorites/manager';
import {
  PlaceAction,
  PlaceInfo,
  placeInfoManager
} from '@/features/map/places';
import {
  mapSearchManager,
  SearchResult,
  SearchStatus,
  SearchSuggestion
} from '@/features/map/search';
import {
  webviewMapService,
  WebViewMapService,
  WebViewMessage
} from '@/services/webviewMapService';

export default function SeniorHomeScreen() {
  // 기본 UI 상태
  const [searchText, setSearchText] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const webViewRef = useRef<WebView>(null);

  // 모듈에서 관리되는 상태들
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceInfo | null>(null);
  const [showPlaceInfo, setShowPlaceInfo] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  // 모듈 초기화 및 이벤트 리스너 설정
  useEffect(() => {
    // WebView 서비스 초기화
    if (webViewRef.current) {
      webviewMapService.setWebViewRef(webViewRef);
    }
    webviewMapService.addMessageHandler('homeScreen', handleWebViewMessage);

    // 검색 매니저 이벤트 리스너 설정
    mapSearchManager.setEventListeners({
      onStatusChange: (status) => {
        setSearchStatus(status);
      },
      onSuggestionsReceived: (suggestions) => {
        setSearchSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      },
      onSearchSuccess: (result) => {
        const place = placeInfoManager.createPlaceFromSearchResult(result);
        setSelectedPlace(place);
        setShowPlaceInfo(true);
        placeInfoManager.showPlaceInfo(place);
      },
      onSearchError: (error) => {
        Alert.alert('검색 오류', error);
      },
    });

    // 장소 정보 매니저 이벤트 리스너 설정
    placeInfoManager.setEventListeners({
      onPlaceInfoShow: (place) => {
        setSelectedPlace(place);
        setShowPlaceInfo(true);
      },
      onPlaceInfoHide: () => {
        setSelectedPlace(null);
        setShowPlaceInfo(false);
      },
      onActionClick: handlePlaceAction,
    });

    // 즐겨찾기 매니저 초기화
    loadFavorites();

    // 키보드 이벤트 리스너
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      // 정리
      webviewMapService.removeMessageHandler('homeScreen');
      mapSearchManager.cleanup();
      placeInfoManager.cleanup();
      favoritesManager.cleanup();
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  /**
   * 즐겨찾기 목록 로드
   */
  const loadFavorites = async () => {
    try {
      const loadedFavorites = await favoritesManager.getFavorites();
      setFavorites(loadedFavorites);
    } catch (error) {
      console.error('즐겨찾기 로드 실패:', error);
    }
  };

  /**
   * WebView 메시지 처리 (기존 이벤트를 모듈로 변환)
   */
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      // 모듈의 메시지 핸들러에 전달할 WebViewMessage 객체 생성
      const message: WebViewMessage = {
        type: data.type,
        location: data.location,
        lat: data.lat,
        lng: data.lng,
        address: data.address,
        roadAddress: data.roadAddress,
        placeType: data.placeType,
        places: data.places,
        searchText: data.searchText,
        message: data.message,
      };
      
      handleModuleWebViewMessage(message);
    } catch (error) {
      console.log('WebView message parsing failed:', event.nativeEvent.data);
    }
  };

  /**
   * 모듈을 통한 WebView 메시지 처리
   */
  const handleModuleWebViewMessage = (message: WebViewMessage) => {
    switch (message.type) {
      case 'MAP_LOADED':
        console.log('카카오맵이 로드되었습니다.');
        break;
      case 'SEARCH_SUCCESS':
        if (message.location && message.lat && message.lng) {
          const searchResult: SearchResult = {
            location: message.location,
            lat: message.lat,
            lng: message.lng,
            address: message.address,
            roadAddress: message.roadAddress,
            placeType: message.placeType,
          };
          mapSearchManager.handleSearchSuccess(searchResult);
        }
        setShowSuggestions(false);
        break;
      case 'PLACES_SEARCH_SUCCESS':
        if (message.places) {
          const suggestions = mapSearchManager.convertPlacesToSuggestions(message.places);
          mapSearchManager.handleSuggestionsReceived(suggestions);
        }
        break;
      case 'SEARCH_FAILED':
      case 'PLACES_SEARCH_FAILED':
      case 'MAPS_NOT_LOADED':
      case 'SEARCH_ERROR':
        mapSearchManager.handleSearchError(message.message || '검색 중 오류가 발생했습니다.');
        break;
      default:
        console.log('Unknown WebView message:', message);
    }
  };

  /**
   * 검색 입력 처리 (디바운싱 적용)
   */
  const handleSearchInput = (text: string) => {
    setSearchText(text);
    
    if (text.trim().length > 0) {
      mapSearchManager.searchWithDebounce(text, (query) => {
        webviewMapService.getSearchSuggestions(query);
      });
    } else {
      setShowSuggestions(false);
      mapSearchManager.clearSuggestions();
    }
  };

  /**
   * 연관검색어 선택 처리
   */
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setSearchText(suggestion.text);
    setShowSuggestions(false);
    
    mapSearchManager.searchImmediate(suggestion.text, (query) => {
      webviewMapService.searchLocation(query);
    });
  };

  /**
   * 검색 실행 (Enter 키)
   */
  const handleSearch = () => {
    if (searchText.trim()) {
      setShowSuggestions(false);
      
      mapSearchManager.searchImmediate(searchText, (query) => {
        webviewMapService.searchLocation(query);
      });
    }
  };

  /**
   * 장소 액션 처리
   */
  const handlePlaceAction = async (action: PlaceAction, place: PlaceInfo) => {
    switch (action.type) {
      case 'navigate':
        Alert.alert('길찾기', `${place.name}로 길찾기를 시작합니다.`);
        break;
      case 'call':
        Alert.alert('전화걸기', `${place.phone}로 전화를 걸겠습니다.`);
        break;
      case 'bookmark':
        // 현재 위치에서 선택된 장소로의 즐겨찾기 추가
        try {
          await favoritesManager.addFavorite('현재 위치', place.name);
          await loadFavorites();
          Alert.alert('즐겨찾기 추가', `${place.name}이(가) 즐겨찾기에 추가되었습니다.`);
        } catch (error) {
          Alert.alert('오류', '즐겨찾기 추가에 실패했습니다.');
        }
        break;
      default:
        console.log(`처리되지 않은 액션: ${action.type}`);
    }
  };

  /**
   * 즐겨찾기 항목 선택 처리
   */
  const handleFavoriteSelect = async (favorite: FavoriteItem) => {
    try {
      await favoritesManager.useFavorite(favorite.id);
      await loadFavorites();
      Alert.alert('이동', FavoritesUtils.formatFavoriteItem(favorite));
    } catch (error) {
      Alert.alert('오류', '즐겨찾기 사용에 실패했습니다.');
    }
  };

  /**
   * 현재 위치 이동 처리
   */
  const handleCurrentLocation = () => {
    webviewMapService.moveToCurrentLocation();
  };

  /**
   * 검색 상태 메시지 반환
   */
  const getSearchStatusMessage = (): string => {
    const statusMessage = mapSearchManager.getStatusMessage();
    return statusMessage || '';
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
          // 카카오맵 초기화를 위한 JavaScript 주입 (모듈에서 생성)
          injectedJavaScript={WebViewMapService.getCompleteMapInitScript()}
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
                <Text style={styles.suggestionText}>{suggestion.text}</Text>
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
          onPress={handleCurrentLocation}
        >
          <Text style={styles.buttonText}>현위치</Text>
        </TouchableOpacity>
      </View>

      {/* 하단 UI */}
      <View style={styles.bottomContainer}>
        {/* 검색 상태 표시 */}
        {getSearchStatusMessage() ? (
          <View style={styles.searchStatusContainer}>
            <Text style={styles.searchStatusText}>{getSearchStatusMessage()}</Text>
          </View>
        ) : null}

        {/* 즐겨찾기 */}
        <View style={styles.favoritesHeader}>
          <Text style={styles.sectionTitle}>즐겨찾기</Text>
          <Text style={styles.editButtonText}>수정</Text>
        </View>
        <ScrollView style={styles.favoritesContainer}>
          {favorites.map((favorite, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleFavoriteSelect(favorite)}
            >
              <Text style={styles.favoriteItem}>{FavoritesUtils.formatFavoriteItem(favorite)}</Text>
            </TouchableOpacity>
          ))}
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
 