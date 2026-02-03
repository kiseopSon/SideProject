import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, runOnJS } from 'react-native-reanimated';

interface DamageIndicatorProps {
  damage: number;
  position: { x: number; y: number };
  type?: 'damage' | 'heal';
  onComplete: () => void;
}

export const DamageIndicator: React.FC<DamageIndicatorProps> = ({ 
  damage, 
  position, 
  type = 'damage',
  onComplete 
}) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    // 애니메이션: 위로 올라가면서 사라짐
    translateY.value = withSequence(
      withTiming(-50, { duration: 800 }),
      withTiming(-80, { duration: 200 })
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withTiming(0, { duration: 700 }, () => {
        runOnJS(onComplete)();
      })
    );
    scale.value = withSequence(
      withTiming(1.2, { duration: 150 }),
      withTiming(1, { duration: 150 }),
      withTiming(0.8, { duration: 600 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const isHeal = type === 'heal';
  const color = isHeal ? '#4caf50' : '#ff5252';
  const prefix = isHeal ? '+' : '-';

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          left: position.x,
          top: position.y,
        },
        animatedStyle
      ]}
    >
      <Text style={[styles.text, { color }]}>
        {prefix}{Math.ceil(damage)}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    ...(Platform.OS === 'web' ? {
      pointerEvents: 'none' as any,
    } : {}),
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    ...(Platform.OS === 'web' ? {
      textShadow: '2px 2px 4px rgba(0, 0, 0, 1)',
    } : {
      textShadowColor: '#000',
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 4,
    }),
  },
});
