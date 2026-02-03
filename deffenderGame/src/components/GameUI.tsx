import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useGameStore } from '../store/gameStore';

export const GameUI: React.FC = () => {
  const { wave, gold, castleHealth, maxCastleHealth, phase, pauseGame, resumeGame, preparationEndTime } =
    useGameStore();
  
  
  // 준비 시간 남은 시간 계산 (실시간 업데이트)
  const [remainingPrepTime, setRemainingPrepTime] = useState(0);
  
  useEffect(() => {
    if (phase === 'preparing' && preparationEndTime) {
      const updateTimer = () => {
        const remaining = Math.max(0, Math.ceil((preparationEndTime - Date.now()) / 1000));
        setRemainingPrepTime(remaining);
        
        if (remaining > 0) {
          setTimeout(updateTimer, 100); // 0.1초마다 업데이트
        }
      };
      updateTimer();
    } else {
      setRemainingPrepTime(0);
    }
  }, [phase, preparationEndTime]);

  const healthPercent = (castleHealth / maxCastleHealth) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.statContainer}>
          <Text style={styles.label}>웨이브</Text>
          <Text style={styles.value}>{wave} / ∞</Text>
        </View>
        <View style={styles.statContainer}>
          <Text style={styles.label}>골드</Text>
          <Text style={styles.value}>💰 {gold}</Text>
        </View>
        <TouchableOpacity
          style={styles.pauseButton}
          onPress={phase === 'playing' ? pauseGame : resumeGame}
        >
          <Text style={styles.pauseText}>{phase === 'playing' ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.castleHealthContainer}>
        <Text style={styles.castleLabel}>🏰 성 체력</Text>
        <View style={styles.castleHealthBar}>
          <View style={[styles.castleHealthFill, { width: `${healthPercent}%` }]} />
          <Text style={styles.castleHealthText}>
            {castleHealth}/{maxCastleHealth}
          </Text>
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
    zIndex: 1001,
    backgroundColor: 'rgba(20, 20, 30, 0.95)',
    paddingTop: 40,
    paddingBottom: 10,
    paddingHorizontal: 16,
    pointerEvents: 'auto',
    borderBottomWidth: 3,
    borderBottomColor: '#4a90e2',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 4px 12px rgba(74, 144, 226, 0.6)',
    } : {
      shadowColor: '#4a90e2',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.6,
      shadowRadius: 12,
      elevation: 12,
    }),
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statContainer: {
    alignItems: 'center',
  },
  label: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    color: '#4a90e2',
    fontSize: 20,
    fontWeight: 'bold',
    ...(Platform.OS === 'web' ? {
      textShadow: '0px 0px 8px rgba(74, 144, 226, 0.8)',
    } : {
      textShadowColor: 'rgba(74, 144, 226, 0.8)',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 8,
    }),
  },
  pauseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseText: {
    fontSize: 20,
  },
  castleHealthContainer: {
    marginTop: 8,
  },
  castleLabel: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  castleHealthBar: {
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  castleHealthFill: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
  castleHealthText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    lineHeight: 20,
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
