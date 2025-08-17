import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SimpleMapProps {
  onLocationSelected?: (location: { latitude: number; longitude: number; address: string }) => void;
}

export default function SimpleMap({ onLocationSelected }: SimpleMapProps) {
  return (
    <View style={styles.container}>
      {/* 지도 그리드 배경 */}
      <View style={styles.mapGrid}>
        {/* 가로선들 */}
        {Array.from({ length: 10 }, (_, i) => (
          <View key={`h-${i}`} style={[styles.gridLine, styles.horizontalLine, { top: `${i * 11}%` }]} />
        ))}
        {/* 세로선들 */}
        {Array.from({ length: 8 }, (_, i) => (
          <View key={`v-${i}`} style={[styles.gridLine, styles.verticalLine, { left: `${i * 14}%` }]} />
        ))}
      </View>
      
      {/* 도로 라인들 */}
      <View style={[styles.road, styles.mainRoad, { top: '30%', left: 0, right: 0 }]} />
      <View style={[styles.road, styles.mainRoad, { top: '70%', left: 0, right: 0 }]} />
      <View style={[styles.road, styles.subRoad, { top: 0, bottom: 0, left: '25%' }]} />
      <View style={[styles.road, styles.subRoad, { top: 0, bottom: 0, left: '65%' }]} />
      
      {/* 건물들 */}
      <View style={[styles.building, { top: '15%', left: '10%', width: 40, height: 30 }]} />
      <View style={[styles.building, { top: '35%', left: '45%', width: 35, height: 25 }]} />
      <View style={[styles.building, { top: '55%', left: '20%', width: 30, height: 35 }]} />
      <View style={[styles.building, { top: '75%', left: '75%', width: 45, height: 20 }]} />
      
      {/* 피보호인 마커들 */}
      <View style={styles.markersContainer}>
        <View style={[styles.marker, { backgroundColor: '#FF0000', top: '25%', left: '30%' }]}>
          <View style={styles.markerInner} />
        </View>
        <View style={[styles.marker, { backgroundColor: '#808080', top: '60%', left: '70%' }]}>
          <View style={styles.markerInner} />
        </View>
        <View style={[styles.marker, { backgroundColor: '#90EE90', top: '40%', left: '20%' }]}>
          <View style={styles.markerInner} />
        </View>
      </View>
      
      {/* 카카오맵 로고 */}
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>Kakao Map</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
    position: 'relative',
  },
  mapGrid: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: '#e0e0e0',
  },
  horizontalLine: {
    width: '100%',
    height: 0.5,
  },
  verticalLine: {
    height: '100%',
    width: 0.5,
  },
  road: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderColor: '#d0d0d0',
    borderWidth: 0.5,
  },
  mainRoad: {
    height: 8,
  },
  subRoad: {
    width: 6,
  },
  building: {
    position: 'absolute',
    backgroundColor: '#e8e8e8',
    borderColor: '#cccccc',
    borderWidth: 1,
    borderRadius: 2,
  },
  markersContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  marker: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  logoContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    elevation: 2,
  },
  logo: {
    fontSize: 10,
    color: '#666',
    fontWeight: 'bold',
  },
});