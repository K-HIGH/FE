import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState(null);
  const [homeLocation, setHomeLocation] = useState(null);
  const [lastStatus, setLastStatus] = useState(null);


  const quickSearchButtons = [
    { icon: 'home', label: '집', color: '#3b82f6' },
    { icon: 'plus-circle', label: '병원', color: '#ef4444' },
    { icon: 'shopping-cart', label: '마트', color: '#22c55e' },
    { icon: 'phone', label: '약국', color: '#a855f7' },
  ];

  const recentSearches = ['서울대학교병원', '이마트 성수점', '우리집'];

  // 위치 권한 요청 및 현재 위치 설정
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('위치 권한이 필요합니다.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);

      const storedHome = await AsyncStorage.getItem('homeLocation');
      if (storedHome) {
        setHomeLocation(JSON.parse(storedHome));
      }
    })();
  }, []);

  // 거리 계산 함수
  function getDistance(coord1, coord2) {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371e3;

    const lat1 = toRad(coord1.latitude);
    const lat2 = toRad(coord2.latitude);
    const deltaLat = toRad(coord2.latitude - coord1.latitude);
    const deltaLon = toRad(coord2.longitude - coord1.longitude);

    const a =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // 외출/귀가 감지 & 서버 전송
  useEffect(() => {
  const checkMovement = async () => {
    const current = await Location.getCurrentPositionAsync({});
    const home = await loadHomeLocation();
    if (!home) return;

    const distance = getDistance(current.coords, home);
    const newStatus = distance > 150 ? '외출' : '귀가';

    if (newStatus !== lastStatus) {
      Alert.alert(`${newStatus} 감지`, `${newStatus}이(가) 감지되었습니다.`);
      setLastStatus(newStatus);
      await sendToServer(newStatus);
    }
  };

  const interval = setInterval(checkMovement, 10000);
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

  return (
    <View style={styles.container}>
      {/* 지도 영역 */}
      <View style={styles.mapSection}>
        <WebView
          originWhitelist={['*']}
          source={require('../../assets/map.html')}
          javaScriptEnabled={true}
          domStorageEnabled={true}
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
          {quickSearchButtons.map((btn, index) => (
            <TouchableOpacity
              key={index}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
