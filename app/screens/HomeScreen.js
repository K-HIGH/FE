import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>어디로 가시나요?</Text>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>경로 찾기 시작</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 28,
    marginBottom: 30
  },
  button: {
    backgroundColor: '#1e90ff',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 10
  },
  buttonText: {
    fontSize: 20,
    color: 'white'
  }
});
