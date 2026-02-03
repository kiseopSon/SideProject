import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Projectile as ProjectileType } from '../types/game';

interface ProjectileProps {
  projectile: ProjectileType;
}

export const Projectile: React.FC<ProjectileProps> = ({ projectile }) => {
  const getEmoji = () => {
    switch (projectile.type) {
      case 'arrow':
        return '➶';
      case 'magic':
        return '✨';
      case 'dagger':
        return '⚔️';
      default:
        return '•';
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          left: projectile.position.x - 10,
          top: projectile.position.y - 10,
        },
      ]}
    >
      <Text style={styles.emoji}>{getEmoji()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 8,
  },
  emoji: {
    fontSize: 16,
  },
});
