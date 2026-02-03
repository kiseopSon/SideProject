import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useGameStore } from '../store/gameStore';

export const GameOverScreen: React.FC = () => {
  const { wave, resetGame, startGame } = useGameStore();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>게임 오버</Text>
        <Text style={styles.emoji}>💀</Text>
        <Text style={styles.subtitle}>웨이브 {wave}에서 실패했습니다</Text>

        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>최종 웨이브: {wave}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={startGame}>
            <Text style={styles.buttonText}>다시 시작</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={resetGame}>
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>메뉴로</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
    padding: 30,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 20,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 40,
    width: '100%',
  },
  statsText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    backgroundColor: '#4a90e2',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4a90e2',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonTextSecondary: {
    color: '#4a90e2',
  },
});
