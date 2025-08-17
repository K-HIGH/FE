import React, { useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { PlaceDetail, SearchResult } from '../../types/protectorTypes';

interface SearchBoxProps {
  onLocationSelected: (location: { latitude: number; longitude: number; address: string; placeName?: string }) => void;
  onPlaceDetailRequested?: (placeDetail: PlaceDetail) => void;
  placeholder?: string;
}

export default function SearchBox({ onLocationSelected, onPlaceDetailRequested, placeholder = "위치 검색" }: SearchBoxProps) {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 카카오 장소 검색 API 호출
  const searchPlaces = async (keyword: string) => {
    if (!keyword.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);

    try {
      // 실제 카카오 REST API 키를 받기 전까지는 더미 데이터로 동작
      // TODO: 실제 REST API 키로 교체 필요
      const USE_REAL_API = false; // 실제 API 키가 있을 때 true로 변경
      
      if (USE_REAL_API) {
        const REST_API_KEY = 'YOUR_REAL_REST_API_KEY_HERE'; // 실제 REST API 키로 교체
        
        const response = await fetch(
          `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(keyword)}&size=10`,
          {
            method: 'GET',
            headers: {
              'Authorization': `KakaoAK ${REST_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('카카오 API 응답:', data);
          
          const results: SearchResult[] = data.documents.map((place: any, index: number) => ({
            id: `${place.id}_${index}`,
            placeName: place.place_name,
            address: place.address_name || place.road_address_name,
            location: {
              latitude: parseFloat(place.y),
              longitude: parseFloat(place.x),
            }
          }));
          
          setSearchResults(results);
          setShowResults(true);
        } else {
          throw new Error(`API 오류: ${response.status}`);
        }
      } else {
        // 더미 데이터로 검색 기능 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 500)); // 검색 지연 시뮬레이션
        
        const dummyResults: SearchResult[] = generateDummyResults(keyword);
        setSearchResults(dummyResults);
        setShowResults(true);
      }
    } catch (error) {
      console.error('장소 검색 오류:', error);
      
      // API 오류 시 더미 데이터로 폴백
      const dummyResults: SearchResult[] = generateDummyResults(keyword);
      setSearchResults(dummyResults);
      setShowResults(true);
    }

    setIsSearching(false);
  };

  // 더미 검색 결과 생성 함수
  const generateDummyResults = (keyword: string): SearchResult[] => {
    const baseLocations = [
      { lat: 37.5665, lng: 126.9780, area: '중구' },
      { lat: 37.5013, lng: 127.0394, area: '강남구' },
      { lat: 37.5700, lng: 126.9850, area: '종로구' },
      { lat: 37.5172, lng: 127.0473, area: '서초구' },
      { lat: 37.5219, lng: 126.9895, area: '용산구' },
    ];

    return baseLocations.slice(0, 3).map((loc, index) => ({
      id: `dummy_${index}`,
      placeName: `${keyword} ${loc.area} ${index + 1}호점`,
      address: `서울특별시 ${loc.area} ${keyword}로 ${(index + 1) * 10}`,
      location: {
        latitude: loc.lat + (Math.random() - 0.5) * 0.01, // 약간의 랜덤 오프셋
        longitude: loc.lng + (Math.random() - 0.5) * 0.01,
      }
    }));
  };

  // 더미 장소 상세 정보 생성 함수
  const generateDummyPlaceDetail = (result: SearchResult): PlaceDetail => {
    const categories = ['카페', '음식점', '마트', '병원', '서점'];
    const phones = ['02-1234-5678', '02-2345-6789', '02-3456-7890'];
    const hours = ['09:00 - 22:00', '10:00 - 21:00', '08:00 - 23:00', '24시간 영업'];
    
    return {
      id: result.id,
      placeName: result.placeName,
      address: result.address,
      roadAddress: `서울특별시 강남구 테헤란로 ${Math.floor(Math.random() * 900) + 100}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      phone: Math.random() > 0.3 ? phones[Math.floor(Math.random() * phones.length)] : undefined,
      openingHours: Math.random() > 0.2 ? hours[Math.floor(Math.random() * hours.length)] : undefined,
      location: result.location,
      rating: Math.random() > 0.4 ? Number((Math.random() * 2 + 3).toFixed(1)) : undefined,
      reviewCount: Math.random() > 0.4 ? Math.floor(Math.random() * 500) + 10 : undefined,
    };
  };

  // 검색어 변경 처리 (디바운싱)
  const handleSearchTextChange = (text: string) => {
    setSearchText(text);

    // 이전 타이머 취소
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // 새 타이머 설정 (500ms 후 검색 실행)
    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(text);
    }, 500);
  };

  // 검색 결과 선택
  const handleSelectResult = (result: SearchResult) => {
    setSearchText(result.placeName);
    setShowResults(false);
    Keyboard.dismiss();
    
    // 지도에 마커 표시
    onLocationSelected({
      latitude: result.location.latitude,
      longitude: result.location.longitude,
      address: result.address,
      placeName: result.placeName
    });

    // 장소 상세 정보 표시 (바텀시트)
    if (onPlaceDetailRequested) {
      const placeDetail = generateDummyPlaceDetail(result);
      onPlaceDetailRequested(placeDetail);
    }
  };

  // 검색 결과 아이템 렌더링
  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity 
      style={styles.resultItem}
      onPress={() => handleSelectResult(item)}
    >
      <Text style={styles.placeName}>{item.placeName}</Text>
      <Text style={styles.address}>{item.address}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={handleSearchTextChange}
          placeholder={placeholder}
          placeholderTextColor="#6c757d"
          returnKeyType="search"
          onSubmitEditing={() => searchPlaces(searchText)}
        />
        {isSearching && (
          <Text style={styles.searchingText}>검색 중...</Text>
        )}
      </View>

      {showResults && searchResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id}
            style={styles.resultsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchBox: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  searchingText: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 10,
  },
  resultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: 200,
    marginTop: 4,
  },
  resultsList: {
    paddingVertical: 8,
  },
  resultItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  placeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#6c757d',
  },
});
