import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useGameStore } from '../store/gameStore';

export const MenuScreen: React.FC = () => {
  const { startGame } = useGameStore();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🏰 디펜더 게임</Text>
        <Text style={styles.subtitle}>성을 지켜라!</Text>

        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>
            몬스터들이 성을 향해 달려옵니다!{'\n'}
            다양한 유닛을 배치하여 성을 지키세요.{'\n\n'}
            각 유닛은 고유한 능력을 가지고 있어{'\n'}
            전략적인 배치가 중요합니다!
          </Text>
        </View>

        <TouchableOpacity style={styles.startButton} onPress={startGame}>
          <Text style={styles.startButtonText}>게임 시작</Text>
        </TouchableOpacity>

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>📖 게임 방법</Text>
          <Text style={styles.instructions}>
            • 하단에서 유닛을 선택하세요{'\n'}
            • 화면을 터치하여 유닛을 배치하세요{'\n'}
            • 몬스터를 처치하여 골드를 얻으세요{'\n'}
            • 성 체력이 0이 되면 게임 오버!
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 24,
    color: '#4a90e2',
    marginBottom: 40,
    textAlign: 'center',
  },
  descriptionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    width: '100%',
  },
  description: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 60,
    marginBottom: 40,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 4px 8px rgba(74, 144, 226, 0.5)',
    } : {
      shadowColor: '#4a90e2',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 8,
    }),
  },
  startButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  instructionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    width: '100%',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 22,
  },
});
