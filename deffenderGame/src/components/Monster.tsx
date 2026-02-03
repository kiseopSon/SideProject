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
import { Monster as MonsterType } from '../types/game';
import { MONSTER_CONFIGS } from '../config/monsterConfigs';

interface MonsterProps {
  monster: MonsterType;
}

const getMonsterColor = (type: string) => {
  switch (type) {
    case 'normal': return { bg: '#ffebee', border: '#ef5350', accent: '#c62828' };
    case 'fast': return { bg: '#fff3e0', border: '#ff9800', accent: '#e65100' };
    case 'tank': return { bg: '#e0e0e0', border: '#757575', accent: '#424242' };
    case 'boss': return { bg: '#f3e5f5', border: '#9c27b0', accent: '#6a1b9a' };
    default: return { bg: '#ffebee', border: '#ef5350', accent: '#c62828' };
  }
};

export const Monster: React.FC<MonsterProps> = ({ monster }) => {
  const config = MONSTER_CONFIGS[monster.type];
  const healthPercent = (monster.health / monster.maxHealth) * 100;
  const colors = getMonsterColor(monster.type);
  
  // 애니메이션 - 좌우로 흔들림
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  
  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 500 }),
        withTiming(3, { duration: 500 })
      ),
      -1,
      true
    );
    if (monster.type === 'boss') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  const isBoss = monster.type === 'boss';

  return (
    <View style={[styles.container, { 
      left: monster.position.x - (isBoss ? 40 : 35), 
      top: monster.position.y - (isBoss ? 40 : 35) 
    }]}>
      <Animated.View style={[styles.monsterBody, isBoss && styles.bossBody, { 
        backgroundColor: colors.bg,
        borderColor: colors.border,
        width: isBoss ? 80 : 70,
        height: isBoss ? 80 : 70,
        borderRadius: isBoss ? 40 : 35,
      }, animatedStyle]}>
        {isBoss && <View style={[styles.bossGlow, { backgroundColor: colors.border }]} />}
        <Text style={[styles.emoji, { fontSize: isBoss ? 48 : 40 }]}>{config.emoji}</Text>
        {isBoss && (
          <View style={[styles.crown, { backgroundColor: '#ffd700' }]}>
            <Text style={styles.crownText}>👑</Text>
          </View>
        )}
      </Animated.View>
      {/* 체력 바 - 더 크고 명확하게 */}
      <View style={[styles.healthBarContainer, { width: isBoss ? 100 : 90 }]}>
        <View style={[styles.healthBarBackground]} />
        <View style={[styles.healthBar, { 
          width: `${healthPercent}%`,
          backgroundColor: healthPercent > 60 ? '#4caf50' : healthPercent > 30 ? '#ff9800' : '#f44336',
        }]} />
        <View style={styles.healthBarBorder} />
      </View>
      {/* 체력 숫자 - 더 명확하게 */}
      <View style={styles.infoContainer}>
        <Text style={styles.healthText}>
          ❤️ {Math.ceil(monster.health)}/{monster.maxHealth}
        </Text>
        <Text style={styles.healthPercentText}>
          {Math.round(healthPercent)}%
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  monsterBody: {
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.7)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.7,
      shadowRadius: 12,
      elevation: 15,
    }),
    overflow: 'hidden',
  },
  bossBody: {
    borderWidth: 5,
  },
  bossGlow: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    opacity: 0.3,
    borderRadius: 40,
  },
  emoji: {
    zIndex: 1,
  },
  crown: {
    position: 'absolute',
    top: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    }),
  },
  crownText: {
    fontSize: 18,
  },
  healthBarContainer: {
    position: 'absolute',
    bottom: -18,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  healthBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  healthBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 6,
  },
  healthBarBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 6,
  },
  infoContainer: {
    position: 'absolute',
    top: -35,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  healthText: {
    fontSize: 12,
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
  healthPercentText: {
    fontSize: 10,
    color: '#ffeb3b',
    fontWeight: 'bold',
    marginTop: 2,
    ...(Platform.OS === 'web' ? {
      textShadow: '1px 1px 2px rgba(0, 0, 0, 1)',
    } : {
      textShadowColor: '#000',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    }),
  },
});
