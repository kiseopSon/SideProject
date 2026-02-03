import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { UNIT_CONFIGS, UnitType } from '../config/unitConfigs';

export const UnitSelector: React.FC = () => {
  const { gold, selectedUnitType, selectUnitType } = useGameStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>유닛 배치</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {(Object.keys(UNIT_CONFIGS) as UnitType[]).map((type) => {
          const config = UNIT_CONFIGS[type];
          const canAfford = gold >= config.cost;
          const isSelected = selectedUnitType === type;

          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.unitButton,
                !canAfford && styles.unitButtonDisabled,
                isSelected && styles.unitButtonSelected,
              ]}
              onPress={() => selectUnitType(isSelected ? null : type)}
              disabled={!canAfford}
            >
              <Text style={styles.unitEmoji}>{config.emoji}</Text>
              <Text style={styles.unitName}>{config.name}</Text>
              <Text style={[styles.unitCost, !canAfford && styles.unitCostDisabled]}>
                💰 {config.cost}
              </Text>
              <Text style={styles.unitDescription}>{config.description}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {selectedUnitType && (
        <Text style={styles.hint}>화면을 터치하여 유닛을 배치하세요</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingVertical: 16,
    paddingHorizontal: 12,
    zIndex: 1001,
    pointerEvents: 'auto',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  scrollView: {
    flexDirection: 'row',
  },
  unitButton: {
    width: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  unitButtonDisabled: {
    opacity: 0.5,
  },
  unitButtonSelected: {
    borderColor: '#4a90e2',
    backgroundColor: 'rgba(74, 144, 226, 0.3)',
  },
  unitEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  unitName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  unitCost: {
    color: '#ffd700',
    fontSize: 12,
    marginBottom: 4,
  },
  unitCostDisabled: {
    color: '#999',
  },
  unitDescription: {
    color: '#ccc',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 4,
  },
  hint: {
    color: '#4a90e2',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
