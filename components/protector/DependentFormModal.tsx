import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Dependent, DependentStatus } from '../../types/protectorTypes';

interface DependentFormModalProps {
  visible: boolean;
  dependent?: Dependent | null; // 편집 모드일 때 기존 데이터
  onClose: () => void;
  onSave: (dependentData: Omit<Dependent, 'id' | 'lastUpdated'>) => void;
}

export default function DependentFormModal({
  visible,
  dependent,
  onClose,
  onSave,
}: DependentFormModalProps) {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState(''); // 관계 (부모, 조부모 등)
  const [phone, setPhone] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [notes, setNotes] = useState('');

  const isEditMode = !!dependent;

  // 편집 모드일 때 기존 데이터로 초기화
  useEffect(() => {
    if (dependent) {
      setName(dependent.name);
      setRelationship(''); // 관계 정보는 나중에 타입에 추가
      setPhone('');
      setHomeAddress(dependent.homeLocation.address || '');
      setEmergencyContact('');
      setNotes('');
    } else {
      // 새로 추가할 때 초기화
      setName('');
      setRelationship('');
      setPhone('');
      setHomeAddress('');
      setEmergencyContact('');
      setNotes('');
    }
  }, [dependent, visible]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('오류', '이름을 입력해주세요.');
      return;
    }

    if (!homeAddress.trim()) {
      Alert.alert('오류', '집 주소를 입력해주세요.');
      return;
    }

    const dependentData: Omit<Dependent, 'id' | 'lastUpdated'> = {
      name: name.trim(),
      status: 'at_home' as DependentStatus,
      currentLocation: {
        latitude: 37.5665, // 기본 위치 (서울 시청)
        longitude: 126.9780,
        address: homeAddress.trim(),
      },
      homeLocation: {
        latitude: 37.5665, // 기본 위치
        longitude: 126.9780,
        address: homeAddress.trim(),
      },
    };

    onSave(dependentData);
  };

  const handleClose = () => {
    Alert.alert(
      '확인',
      isEditMode ? '편집을 취소하시겠습니까?' : '추가를 취소하시겠습니까?',
      [
        { text: '계속 작성', style: 'cancel' },
        { text: '취소', style: 'destructive', onPress: onClose }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancelButton}>취소</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {isEditMode ? '피보호인 편집' : '피보호인 추가'}
          </Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>저장</Text>
          </TouchableOpacity>
        </View>

        {/* 폼 */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 기본 정보 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>기본 정보</Text>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>이름 *</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="예) 홍길동"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>관계</Text>
              <TextInput
                style={styles.textInput}
                value={relationship}
                onChangeText={setRelationship}
                placeholder="예) 부모님, 조부모님, 친척"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>전화번호</Text>
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="예) 010-1234-5678"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* 주소 정보 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>주소 정보</Text>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>집 주소 *</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={homeAddress}
                onChangeText={setHomeAddress}
                placeholder="예) 서울시 강남구 테헤란로 123"
                placeholderTextColor="#999"
                multiline
                numberOfLines={2}
              />
            </View>
          </View>

          {/* 비상 연락처 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>비상 연락처</Text>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>비상 연락처</Text>
              <TextInput
                style={styles.textInput}
                value={emergencyContact}
                onChangeText={setEmergencyContact}
                placeholder="예) 010-9876-5432 (가족)"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* 메모 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>메모</Text>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>추가 정보</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="특이사항이나 주의사항을 입력하세요"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  cancelButton: {
    fontSize: 16,
    color: '#dc3545',
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  bottomSpacing: {
    height: 40,
  },
});
