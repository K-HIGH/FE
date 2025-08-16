import DependentFormModal from '@/components/protector/DependentFormModal';
import DependentListModal from '@/components/protector/DependentListModal';
import PlaceDetailBottomSheet from '@/components/protector/PlaceDetailBottomSheet';
import ProtectorMap from '@/components/protector/ProtectorMap';
import SearchBox from '@/components/protector/SearchBox';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Dependent, PlaceDetail, STATUS_COLORS, STATUS_TEXT } from '@/types/protectorTypes';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProtectorHome() {
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);

  const [searchResult, setSearchResult] = useState<{
    latitude: number;
    longitude: number;
    placeName: string;
    address: string;
  } | null>(null);

  // 장소 상세 정보 바텀시트 상태
  const [selectedPlaceDetail, setSelectedPlaceDetail] = useState<PlaceDetail | null>(null);
  const [showPlaceDetail, setShowPlaceDetail] = useState(false);

  // 피보호인 관리 상태
  const [dependents, setDependents] = useState<Dependent[]>([
    // 더미 데이터
    {
      id: '1',
      name: '피보호인1',
      status: 'out_with_destination',
      currentLocation: {
        latitude: 37.5665,
        longitude: 126.9780,
        address: '서울특별시 중구 태평로1가 31'
      },
      homeLocation: {
        latitude: 37.5665,
        longitude: 126.9780,
        address: '서울특별시 중구 태평로1가 31'
      },
      destination: {
        name: '이마트 강남점',
        location: {
          latitude: 37.5013,
          longitude: 127.0394,
          address: '서울특별시 강남구 테헤란로 427'
        }
      },
      lastUpdated: new Date(),
    },
    {
      id: '2',
      name: '피보호인2',
      status: 'out_without_destination',
      currentLocation: {
        latitude: 37.5675,
        longitude: 126.9790,
        address: '서울특별시 중구 명동2가'
      },
      homeLocation: {
        latitude: 37.5665,
        longitude: 126.9780,
        address: '서울특별시 중구 태평로1가 31'
      },
      lastUpdated: new Date(),
    },
    {
      id: '3',
      name: '피보호인3',
      status: 'at_home',
      currentLocation: {
        latitude: 37.5665,
        longitude: 126.9780,
        address: '서울특별시 중구 태평로1가 31'
      },
      homeLocation: {
        latitude: 37.5665,
        longitude: 126.9780,
        address: '서울특별시 중구 태평로1가 31'
      },
      lastUpdated: new Date(),
    }
  ]);

  const [showDependentList, setShowDependentList] = useState(false);
  const [showDependentForm, setShowDependentForm] = useState(false);
  const [editingDependent, setEditingDependent] = useState<Dependent | null>(null);

  // 검색 결과 선택 처리 (SearchBox에서 호출)
  const handleSearchLocationSelected = (location: { latitude: number; longitude: number; address: string; placeName?: string }) => {
    const searchData = {
      latitude: location.latitude,
      longitude: location.longitude,
      placeName: location.placeName || '검색 위치',
      address: location.address
    };
    
    setSearchResult(searchData);
    console.log('검색 위치 선택됨:', searchData);
  };

  // 장소 상세 정보 요청 처리 (SearchBox에서 호출)
  const handlePlaceDetailRequested = (placeDetail: PlaceDetail) => {
    setSelectedPlaceDetail(placeDetail);
    setShowPlaceDetail(true);
  };

  // 바텀시트 닫기
  const handleCloseBottomSheet = () => {
    setShowPlaceDetail(false);
    setSelectedPlaceDetail(null);
  };

  // 피보호인 관리 핸들러들
  const handleOpenDependentList = () => {
    setShowDependentList(true);
  };

  const handleCloseDependentList = () => {
    setShowDependentList(false);
  };

  const handleAddDependent = () => {
    setEditingDependent(null);
    setShowDependentForm(true);
    setShowDependentList(false);
  };

  const handleEditDependent = (dependent: Dependent) => {
    setEditingDependent(dependent);
    setShowDependentForm(true);
    setShowDependentList(false);
  };

  const handleDeleteDependent = (dependentId: string) => {
    setDependents(prev => prev.filter(d => d.id !== dependentId));
    Alert.alert('완료', '피보호인이 삭제되었습니다.');
  };

  const handleViewLocation = (dependent: Dependent) => {
    // 지도에서 해당 피보호인 위치로 이동
    setSearchResult({
      latitude: dependent.currentLocation.latitude,
      longitude: dependent.currentLocation.longitude,
      placeName: dependent.name,
      address: dependent.currentLocation.address || '위치 정보 없음'
    });
    setShowDependentList(false);
    Alert.alert('위치 표시', `${dependent.name}님의 현재 위치를 지도에 표시했습니다.`);
  };

  const handleSaveDependent = (dependentData: Omit<Dependent, 'id' | 'lastUpdated'>) => {
    if (editingDependent) {
      // 편집 모드
      setDependents(prev => prev.map(d => 
        d.id === editingDependent.id 
          ? { ...dependentData, id: d.id, lastUpdated: new Date() }
          : d
      ));
      Alert.alert('완료', '피보호인 정보가 수정되었습니다.');
    } else {
      // 추가 모드
      const newDependent: Dependent = {
        ...dependentData,
        id: Date.now().toString(),
        lastUpdated: new Date(),
      };
      setDependents(prev => [...prev, newDependent]);
      Alert.alert('완료', '새 피보호인이 추가되었습니다.');
    }
    
    setShowDependentForm(false);
    setEditingDependent(null);
  };

  const handleCloseDependentForm = () => {
    setShowDependentForm(false);
    setEditingDependent(null);
  };

  // 지도 클릭 처리 (ProtectorMap에서 호출)
  const handleMapLocationSelected = (location: { latitude: number; longitude: number; address: string }) => {
    setSelectedLocation(location);
    Alert.alert(
      '지도 위치 선택됨',
      `선택된 위치: ${location.address}\n위도: ${location.latitude.toFixed(6)}\n경도: ${location.longitude.toFixed(6)}`,
      [{ text: '확인' }]
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* 헤더 영역 */}
      <View style={styles.header}>
        <ThemedText type="title">돋보길</ThemedText>
      </View>

      {/* 지도 영역 */}
      <View style={styles.mapContainer}>
        <ProtectorMap 
          onLocationSelected={handleMapLocationSelected}
          searchResult={searchResult}
        />
        
        {/* 검색창 */}
        <View style={styles.searchContainer}>
          <SearchBox 
            onLocationSelected={handleSearchLocationSelected}
            onPlaceDetailRequested={handlePlaceDetailRequested}
          />
        </View>
      </View>

      {/* 하단 패널 영역 */}
      <View style={styles.bottomPanel}>
        <ThemedText type="subtitle" style={styles.panelTitle}>피보호인 목록</ThemedText>
        
        {/* 피보호인 상태 카드들 */}
        <View style={styles.dependentsList}>
          {dependents.map((dependent) => (
            <TouchableOpacity 
              key={dependent.id}
              style={styles.dependentCard}
              onPress={() => handleViewLocation(dependent)}
            >
              <Text style={[styles.dependentText, { color: STATUS_COLORS[dependent.status] }]}>
                {dependent.name}: {STATUS_TEXT[dependent.status]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 하단 버튼들 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.bottomButton} onPress={handleOpenDependentList}>
            <Text style={styles.buttonText}>피보호인 목록</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomButton}>
            <Text style={styles.buttonText}>설정</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 장소 상세 정보 바텀시트 */}
      <PlaceDetailBottomSheet
        visible={showPlaceDetail}
        placeDetail={selectedPlaceDetail}
        onClose={handleCloseBottomSheet}
      />

      {/* 피보호인 목록 모달 */}
      <DependentListModal
        visible={showDependentList}
        dependents={dependents}
        onClose={handleCloseDependentList}
        onAddDependent={handleAddDependent}
        onEditDependent={handleEditDependent}
        onDeleteDependent={handleDeleteDependent}
        onViewLocation={handleViewLocation}
      />

      {/* 피보호인 추가/편집 모달 */}
      <DependentFormModal
        visible={showDependentForm}
        dependent={editingDependent}
        onClose={handleCloseDependentForm}
        onSave={handleSaveDependent}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  searchContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  bottomPanel: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  panelTitle: {
    marginBottom: 15,
  },
  dependentsList: {
    marginBottom: 20,
  },
  dependentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },

  dependentText: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  bottomButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
