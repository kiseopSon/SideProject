import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  interpolate 
} from 'react-native-reanimated';
import { Unit as UnitType } from '../types/game';
import { UNIT_CONFIGS } from '../config/unitConfigs';

interface UnitProps {
  unit: UnitType;
}

const getUnitColor = (type: string) => {
  switch (type) {
    case 'archer': return { bg: '#e3f2fd', border: '#2196f3', accent: '#1976d2' };
    case 'wizard': return { bg: '#f3e5f5', border: '#9c27b0', accent: '#7b1fa2' };
    case 'tank': return { bg: '#fff3e0', border: '#ff9800', accent: '#f57c00' };
    case 'healer': return { bg: '#e8f5e9', border: '#4caf50', accent: '#388e3c' };
    case 'assassin': return { bg: '#fce4ec', border: '#e91e63', accent: '#c2185b' };
    default: return { bg: '#f5f5f5', border: '#9e9e9e', accent: '#616161' };
  }
};

export const Unit: React.FC<UnitProps> = ({ unit }) => {
  const config = UNIT_CONFIGS[unit.type];
  const healthPercent = (unit.health / unit.maxHealth) * 100;
  const colors = getUnitColor(unit.type);
  
  // 애니메이션 - 약간의 펄스 효과
  const scale = useSharedValue(1);
  
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[styles.container, { left: unit.position.x - 30, top: unit.position.y - 30 }]}>
      <Animated.View style={[styles.unitBody, { 
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }, animatedStyle]}>
        <View style={[styles.glow, { backgroundColor: colors.border }]} />
        <Text style={styles.emoji}>{config.emoji}</Text>
        <View style={[styles.levelBadge, { backgroundColor: colors.accent }]}>
          <Text style={styles.levelText}>Lv{unit.level}</Text>
        </View>
      </Animated.View>
      <View style={styles.healthBarContainer}>
        <View style={[styles.healthBar, { 
          width: `${healthPercent}%`,
          backgroundColor: healthPercent > 50 ? '#4caf50' : healthPercent > 25 ? '#ff9800' : '#f44336',
        }]} />
      </View>
      {(unit.health < unit.maxHealth || true) && (
        <View style={styles.infoContainer}>
          <Text style={styles.healthText}>❤️ {Math.ceil(unit.health)}/{unit.maxHealth}</Text>
          <Text style={styles.damageText}>⚔️ {unit.damage}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  unitBody: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.6)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.6,
      shadowRadius: 12,
      elevation: 12,
    }),
    overflow: 'hidden',
    // 3D 느낌의 그라디언트 효과를 위한 배경
  },
  glow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.2,
    borderRadius: 30,
  },
  emoji: {
    fontSize: 36,
    zIndex: 1,
  },
  levelBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  levelText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  healthBarContainer: {
    position: 'absolute',
    bottom: -10,
    width: 60,
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  healthBar: {
    height: '100%',
  },
  infoContainer: {
    position: 'absolute',
    top: -35,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  healthText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
    ...(Platform.OS === 'web' ? {
      textShadow: '1px 1px 2px rgba(0, 0, 0, 1)',
    } : {
      textShadowColor: '#000',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    }),
  },
  damageText: {
    fontSize: 10,
    color: '#ffd700',
    fontWeight: 'bold',
    ...(Platform.OS === 'web' ? {
      textShadow: '1px 1px 2px rgba(0, 0, 0, 1)',
    } : {
      textShadowColor: '#000',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    }),
  },
});
