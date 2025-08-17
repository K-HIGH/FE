import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SimpleKakaoMapProps {
  onLocationSelected?: (location: { latitude: number; longitude: number; address: string }) => void;
}

export default function SimpleKakaoMap({ onLocationSelected }: SimpleKakaoMapProps) {
  const openKakaoMap = () => {
    // 카카오맵 앱으로 이동 (서울 시청)
    const kakaoMapUrl = 'https://map.kakao.com/link/map/37.5665,126.9780';
    Linking.openURL(kakaoMapUrl);
  };

  const handleLocationSelect = () => {
    if (onLocationSelected) {
      onLocationSelected({
        latitude: 37.5665,
        longitude: 126.9780,
        address: '서울특별시 중구 태평로1가 31'
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* 지도 배경 */}
      <View style={styles.mapBackground}>
        <View style={styles.gridContainer}>
          {/* 그리드 라인들 */}
          {Array.from({ length: 8 }, (_, i) => (
            <View key={`h-${i}`} style={[styles.gridLine, { top: `${i * 12.5}%` }]} />
          ))}
          {Array.from({ length: 6 }, (_, i) => (
            <View key={`v-${i}`} style={[styles.gridLine, styles.verticalLine, { left: `${i * 16.67}%` }]} />
          ))}
        </View>
        
        {/* 도로들 */}
        <View style={[styles.road, styles.horizontalRoad, { top: '40%' }]} />
        <View style={[styles.road, styles.verticalRoad, { left: '30%' }]} />
        <View style={[styles.road, styles.verticalRoad, { left: '70%' }]} />
        
        {/* 건물들 */}
        <View style={[styles.building, { top: '20%', left: '15%' }]} />
        <View style={[styles.building, { top: '25%', left: '50%', width: 30, height: 25 }]} />
        <View style={[styles.building, { top: '60%', left: '20%', width: 25, height: 30 }]} />
        <View style={[styles.building, { top: '65%', left: '80%', width: 35, height: 20 }]} />
        
        {/* 피보호인 마커들 */}
        <View style={[styles.marker, styles.redMarker, { top: '35%', left: '40%' }]}>
          <Text style={styles.markerNumber}>1</Text>
        </View>
        <View style={[styles.marker, styles.grayMarker, { top: '55%', left: '65%' }]}>
          <Text style={styles.markerNumber}>2</Text>
        </View>
        <View style={[styles.marker, styles.greenMarker, { top: '45%', left: '25%' }]}>
          <Text style={styles.markerNumber}>3</Text>
        </View>
        
        {/* 카카오맵 로고 */}
        <TouchableOpacity style={styles.kakaoLogo} onPress={openKakaoMap}>
          <Text style={styles.logoText}>Kakao Map</Text>
        </TouchableOpacity>
        
        {/* 지도 클릭 영역 */}
        <TouchableOpacity 
          style={styles.clickOverlay} 
          onPress={handleLocationSelect}
          activeOpacity={0.8}
        >
          <View style={styles.centerInfo}>
            <Text style={styles.centerText}>🗺️</Text>
            <Text style={styles.centerSubText}>서울 중구 일대</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  gridContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: '#e0e0e0',
    height: 0.5,
    width: '100%',
  },
  verticalLine: {
    width: 0.5,
    height: '100%',
  },
  road: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderColor: '#d0d0d0',
    borderWidth: 0.5,
  },
  horizontalRoad: {
    width: '100%',
    height: 6,
  },
  verticalRoad: {
    width: 6,
    height: '100%',
  },
  building: {
    position: 'absolute',
    width: 40,
    height: 30,
    backgroundColor: '#e8e8e8',
    borderColor: '#cccccc',
    borderWidth: 1,
    borderRadius: 2,
  },
  marker: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  redMarker: {
    backgroundColor: '#FF0000',
  },
  grayMarker: {
    backgroundColor: '#808080',
  },
  greenMarker: {
    backgroundColor: '#90EE90',
  },
  markerNumber: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  kakaoLogo: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  logoText: {
    fontSize: 11,
    color: '#666',
    fontWeight: 'bold',
  },
  clickOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 3,
  },
  centerText: {
    fontSize: 24,
    marginBottom: 4,
  },
  centerSubText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});
