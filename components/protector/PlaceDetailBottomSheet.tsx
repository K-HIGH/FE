import React from 'react';
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { PlaceDetail } from '../../types/protectorTypes';

interface PlaceDetailBottomSheetProps {
  visible: boolean;
  placeDetail: PlaceDetail | null;
  onClose: () => void;
}

export default function PlaceDetailBottomSheet({
  visible,
  placeDetail,
  onClose,
}: PlaceDetailBottomSheetProps) {
  if (!placeDetail) return null;

  // 전화걸기 기능
  const handleCallPress = () => {
    if (placeDetail.phone) {
      const phoneUrl = `tel:${placeDetail.phone}`;
      Linking.canOpenURL(phoneUrl)
        .then(supported => {
          if (supported) {
            Linking.openURL(phoneUrl);
          } else {
            Alert.alert('오류', '전화 기능을 사용할 수 없습니다.');
          }
        })
        .catch(err => console.error('전화 오류:', err));
    }
  };

  // 길찾기 기능 (카카오맵으로 연결)
  const handleDirectionsPress = () => {
    const { latitude, longitude } = placeDetail.location;
    const kakaoMapUrl = `kakaomap://route?ep=${longitude},${latitude}&by=PUBLICTRANSIT`;
    const webUrl = `https://map.kakao.com/link/to/${encodeURIComponent(placeDetail.placeName)},${latitude},${longitude}`;
    
    Linking.canOpenURL(kakaoMapUrl)
      .then(supported => {
        if (supported) {
          Linking.openURL(kakaoMapUrl);
        } else {
          Linking.openURL(webUrl);
        }
      })
      .catch(() => {
        Linking.openURL(webUrl);
      });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayTouch} onPress={onClose} />
        
        <View style={styles.bottomSheet}>
          <View style={styles.handle} />
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.placeName}>{placeDetail.placeName}</Text>
            <Text style={styles.category}>{placeDetail.category}</Text>
            
            {placeDetail.rating && (
              <View style={styles.ratingContainer}>
                <Text style={styles.rating}>⭐ {placeDetail.rating.toFixed(1)}</Text>
                {placeDetail.reviewCount && (
                  <Text style={styles.reviewCount}>({placeDetail.reviewCount}개 리뷰)</Text>
                )}
              </View>
            )}
            
            <View style={styles.divider} />
            
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>📍 주소</Text>
              <Text style={styles.infoText}>{placeDetail.address}</Text>
              {placeDetail.roadAddress && (
                <Text style={styles.infoSubText}>{placeDetail.roadAddress}</Text>
              )}
            </View>
            
            {placeDetail.phone && (
              <TouchableOpacity style={styles.infoSection} onPress={handleCallPress}>
                <Text style={styles.infoLabel}>📞 전화번호</Text>
                <Text style={[styles.infoText, styles.phoneText]}>{placeDetail.phone}</Text>
              </TouchableOpacity>
            )}
            
            {placeDetail.openingHours && (
              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>🕒 영업시간</Text>
                <Text style={styles.infoText}>{placeDetail.openingHours}</Text>
              </View>
            )}
            
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton} onPress={handleDirectionsPress}>
                <Text style={styles.actionButtonText}>🗺️ 길찾기</Text>
              </TouchableOpacity>
              
              {placeDetail.phone && (
                <TouchableOpacity style={styles.actionButton} onPress={handleCallPress}>
                  <Text style={styles.actionButtonText}>📞 전화걸기</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouch: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  placeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  category: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rating: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f39c12',
    marginRight: 8,
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
  },
  infoSubText: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  phoneText: {
    color: '#007bff',
    textDecorationLine: 'underline',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 10,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
