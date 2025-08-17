import React from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Dependent, STATUS_COLORS, STATUS_TEXT } from '../../types/protectorTypes';

interface DependentListModalProps {
  visible: boolean;
  dependents: Dependent[];
  onClose: () => void;
  onAddDependent: () => void;
  onEditDependent: (dependent: Dependent) => void;
  onDeleteDependent: (dependentId: string) => void;
  onViewLocation: (dependent: Dependent) => void;
}

export default function DependentListModal({
  visible,
  dependents,
  onClose,
  onAddDependent,
  onEditDependent,
  onDeleteDependent,
  onViewLocation,
}: DependentListModalProps) {

  const handleDeletePress = (dependent: Dependent) => {
    Alert.alert(
      '피보호인 삭제',
      `${dependent.name}님을 목록에서 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          style: 'destructive',
          onPress: () => onDeleteDependent(dependent.id)
        }
      ]
    );
  };

  const renderDependentItem = ({ item }: { item: Dependent }) => (
    <View style={styles.dependentItem}>
      <View style={styles.dependentInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.dependentName}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
            <Text style={styles.statusText}>{STATUS_TEXT[item.status]}</Text>
          </View>
        </View>
        
        <Text style={styles.dependentAddress}>
          📍 {item.currentLocation.address || '위치 정보 없음'}
        </Text>
        
        <Text style={styles.lastUpdated}>
          🕒 마지막 업데이트: {item.lastUpdated.toLocaleTimeString('ko-KR')}
        </Text>
        
        {item.destination && (
          <Text style={styles.destination}>
            🎯 목적지: {item.destination.name}
          </Text>
        )}
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.locationButton]}
          onPress={() => onViewLocation(item)}
        >
          <Text style={styles.actionButtonText}>📍 위치보기</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => onEditDependent(item)}
        >
          <Text style={styles.actionButtonText}>✏️ 편집</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeletePress(item)}
        >
          <Text style={styles.actionButtonText}>🗑️ 삭제</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>← 닫기</Text>
          </TouchableOpacity>
          <Text style={styles.title}>피보호인 목록</Text>
          <TouchableOpacity onPress={onAddDependent} style={styles.addButton}>
            <Text style={styles.addButtonText}>+ 추가</Text>
          </TouchableOpacity>
        </View>

        {/* 피보호인 리스트 */}
        {dependents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>등록된 피보호인이 없습니다</Text>
            <TouchableOpacity style={styles.emptyAddButton} onPress={onAddDependent}>
              <Text style={styles.emptyAddButtonText}>첫 번째 피보호인 추가하기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={dependents}
            renderItem={renderDependentItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
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
  closeButton: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  dependentItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dependentInfo: {
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dependentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  dependentAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  destination: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  locationButton: {
    backgroundColor: '#28a745',
  },
  editButton: {
    backgroundColor: '#ffc107',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyAddButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
