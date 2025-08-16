// app/(tabs)/index.tsx
import { useSession } from '@/context/AuthContext';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

// 타입들
type Status = '외출' | '귀가' | null;

type QuickButton = {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  color: string;
};

type Coords = Location.LocationObjectCoords;

export default function IndexScreen() {
  const { signOut } = useSession();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [location, setLocation] = useState<Coords | null>(null);
  const [homeLocation, setHomeLocation] = useState<Coords | null>(null);
  const [lastStatus, setLastStatus] = useState<Status>(null);

  const quickSearchButtons: QuickButton[] = [
    { icon: 'home', label: '집', color: '#3b82f6' },
    { icon: 'plus-circle', label: '병원', color: '#ef4444' },
    { icon: 'shopping-cart', label: '마트', color: '#22c55e' },
    { icon: 'phone', label: '약국', color: '#a855f7' },
  ];

  const recentSearches: string[] = ['서울대학교병원', '이마트 성수점', '우리집'];

  // ---- helpers --------------------------------------------------------------

  const loadHomeLocation = async (): Promise<Coords | null> => {
    const stored = await AsyncStorage.getItem('homeLocation');
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored) as Coords;
      return parsed;
    } catch {
      return null;
    }
  };

  const sendToServer = async (status: Exclude<Status, null>) => {
    try {
      // TODO: 실제 API 엔드포인트로 교체
      // await api.post('/api/v1/location/status', { status });
      console.log('[sendToServer]', status);
    } catch (e) {
      console.log('[sendToServer error]', e);
    }
  };

  // 거리 계산 (Haversine)
  function getDistance(a: Coords, b: Coords): number {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371e3;

    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);

    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

    return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  // ---- effects --------------------------------------------------------------

  // 위치 권한 요청 + 현재 위치 + 저장된 집 위치 로드
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('위치 권한이 필요합니다.');
        return;
      }

      const current = await Location.getCurrentPositionAsync({});
      setLocation(current.coords);

      const storedHome = await loadHomeLocation();
      if (storedHome) setHomeLocation(storedHome);
    })();
  }, []);

  // 외출/귀가 감지 & 서버 전송 (10초 간격)
  useEffect(() => {
    const checkMovement = async () => {
      try {
        const current = await Location.getCurrentPositionAsync({});
        const home = await loadHomeLocation();
        if (!home) return;

        const distance = getDistance(current.coords, home);
        const newStatus: Exclude<Status, null> = distance > 150 ? '외출' : '귀가';

        if (newStatus !== lastStatus) {
          Alert.alert(`${newStatus} 감지`, `${newStatus}이(가) 감지되었습니다.`);
          setLastStatus(newStatus);
          await sendToServer(newStatus);
        }
      } catch (e) {
        console.log('[checkMovement error]', e);
      }
    };

    const interval = setInterval(checkMovement, 10_000);
    return () => clearInterval(interval);
  }, [lastStatus]);

  // 기준 위치 저장
  const handleSaveHome = async () => {
    if (location) {
      await AsyncStorage.setItem('homeLocation', JSON.stringify(location));
      setHomeLocation(location);
      Alert.alert('저장 완료', '현재 위치를 집으로 설정했습니다.');
    } else {
      Alert.alert('오류', '위치를 불러오지 못했습니다.');
    }
  };

  // ---- render ---------------------------------------------------------------

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Home</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => signOut()}>
          <Feather name="log-out" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* 지도 영역 */}
      <View style={styles.mapSection}>
        <WebView
          originWhitelist={['*']}
          source={require('../../assets/map.html')}
          javaScriptEnabled
          domStorageEnabled
          style={{ width: '100%', height: 300 }}
        />

        {/* 확대/축소 */}
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomButton}>
            <Feather name="plus" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomButton}>
            <Feather name="minus" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* 현재 위치 버튼 */}
        <TouchableOpacity style={styles.locationButton}>
          <Feather name="navigation" size={28} color="#2563eb" />
        </TouchableOpacity>

        {/* 위치 마커 */}
        <Feather name="map-pin" size={32} color="#ef4444" style={styles.pinIcon} />
      </View>

      {/* 검색 및 버튼들 */}
      <ScrollView style={styles.searchSection} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* 기준 위치 저장 버튼 */}
        <TouchableOpacity onPress={handleSaveHome} style={styles.saveHomeButton}>
          <Text style={styles.saveHomeText}>현재 위치를 집으로 설정</Text>
        </TouchableOpacity>

        {/* 검색창 */}
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="어디로 가시겠어요?"
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.searchButton}>
            <Feather name="search" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        {/* 자주 찾는 곳 */}
        <Text style={styles.sectionTitle}>자주 찾는 곳</Text>
        <View style={styles.quickButtonsWrapper}>
          {quickSearchButtons.map((btn, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.quickButton, { backgroundColor: btn.color }]}
              onPress={() => setSearchQuery(btn.label)}
            >
              <Feather name={btn.icon} size={20} color="#fff" />
              <Text style={styles.quickButtonLabel}>{btn.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 최근 검색 */}
        <Text style={styles.sectionTitle}>최근 검색</Text>
        {recentSearches.map((item, idx) => (
          <View key={idx} style={styles.card}>
            <Feather name="map-pin" size={18} color="#aaa" />
            <Text style={styles.cardText}>{item}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ----- styles ---------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  mapSection: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  zoomControls: {
    position: 'absolute',
    top: 20,
    right: 20,
    gap: 10,
  },
  zoomButton: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  locationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#93c5fd',
  },
  pinIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -16,
    marginLeft: -16,
  },
  searchSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  saveHomeButton: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  saveHomeText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  searchBarContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
  },
  searchButton: {
    marginLeft: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 50,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#374151',
  },
  quickButtonsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  quickButtonLabel: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 6,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  cardText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#374151',
  },
});