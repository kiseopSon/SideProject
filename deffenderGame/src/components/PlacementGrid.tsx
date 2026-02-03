import React from 'react';
import { View, StyleSheet, Dimensions, Text, Platform } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { isNearPath } from '../config/pathConfig';
import { UNIT_CONFIGS } from '../config/unitConfigs';

const { width, height } = Dimensions.get('window');
const GRID_SIZE = 50; // 그리드 크기
const TOP_UI_HEIGHT = 120;
const BOTTOM_UI_HEIGHT = 200;
const GAME_AREA_TOP = TOP_UI_HEIGHT;
const GAME_AREA_BOTTOM = height - BOTTOM_UI_HEIGHT;
const GAME_AREA_HEIGHT = GAME_AREA_BOTTOM - GAME_AREA_TOP;

interface PlacementGridProps {
  mousePosition: { x: number; y: number } | null;
}

export const PlacementGrid: React.FC<PlacementGridProps> = ({ mousePosition }) => {
  const { selectedUnitType, units } = useGameStore();

  if (!selectedUnitType) return null;

  const config = UNIT_CONFIGS[selectedUnitType];
  
  // 배치된 유닛 위치와 레벨 저장
  const placedUnits = new Map<string, { level: number }>();
  units.forEach(unit => {
    const gridX = Math.floor(unit.position.x / GRID_SIZE);
    const gridY = Math.floor((unit.position.y - TOP_UI_HEIGHT) / GRID_SIZE);
    const gridKey = `${gridX}-${gridY}`;
    placedUnits.set(gridKey, { level: unit.level || 1 });
  });

  // 그리드 렌더링
  const renderGrid = () => {
    const cols = Math.floor(width / GRID_SIZE);
    const rows = Math.floor(GAME_AREA_HEIGHT / GRID_SIZE);
    const gridItems: JSX.Element[] = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * GRID_SIZE;
        const y = GAME_AREA_TOP + row * GRID_SIZE;
        const centerX = x + GRID_SIZE / 2;
        const centerY = y + GRID_SIZE / 2;

        // 경로 근처인지 확인 (절대 좌표로)
        const nearPath = isNearPath({ x: centerX, y: centerY }, 35);
        const canPlace = !nearPath;
        
        // 이미 배치된 위치인지 확인 (그리드 키는 col-row 기준으로 일치)
        const gridKey = `${col}-${row}`;
        const placedUnit = placedUnits.get(gridKey);
        const isPlaced = placedUnit !== undefined;
        
        // 마우스 위치와 일치하는지 확인 (배치 가능 위치 표시)
        // mousePosition은 절대 좌표로 전달되므로 centerY와 직접 비교
        const isHovered = mousePosition && 
          Math.abs(mousePosition.x - centerX) < GRID_SIZE / 2 &&
          Math.abs(mousePosition.y - centerY) < GRID_SIZE / 2;

        // 배치된 위치는 회색으로 표시하고 레벨 숫자 표시
        if (isPlaced && placedUnit) {
          gridItems.push(
            <View
              key={`placed-${row}-${col}`}
              style={[
                styles.placedMarker,
                {
                  left: x + GRID_SIZE / 2 - 20,
                  top: y + GRID_SIZE / 2 - 20,
                },
              ]}
            >
              <View style={styles.placedIcon} />
              <Text style={styles.placedText}>{placedUnit.level}</Text>
            </View>
          );
        }
        
        // 배치 가능한 위치 표시 (마우스 호버 시)
        if (canPlace && !isPlaced && isHovered) {
          gridItems.push(
            <View
              key={`preview-${row}-${col}`}
              style={[
                styles.placementPreview,
                {
                  left: centerX - 25,
                  top: centerY - 25,
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  borderColor: '#4caf50',
                  borderWidth: 2,
                  backgroundColor: 'rgba(76, 175, 80, 0.2)',
                },
              ]}
            />
          );
        }
        
        // 경로 근처는 빨간색으로만 표시 (깜빡거림 없음)
        if (!canPlace) {
          gridItems.push(
            <View
              key={`grid-${row}-${col}`}
              style={[
                styles.gridCell,
                {
                  left: x,
                  top: y,
                  width: GRID_SIZE,
                  height: GRID_SIZE,
                  backgroundColor: 'rgba(244, 67, 54, 0.2)',
                  borderColor: 'rgba(244, 67, 54, 0.3)',
                },
              ]}
            />
          );
        }
      }
    }

    return gridItems;
  };

  return <View style={styles.container}>{renderGrid()}</View>;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 150,
    ...(Platform.OS === 'web' ? {
      pointerEvents: 'none' as any,
    } : {
      pointerEvents: 'none' as any,
    }),
  },
  gridCell: {
    position: 'absolute',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  placementPreview: {
    position: 'absolute',
    borderStyle: 'solid',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  previewInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  rangeIndicator: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.5)',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  placedMarker: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(100, 100, 100, 0.6)',
    borderWidth: 2,
    borderColor: 'rgba(200, 200, 200, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  placedIcon: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 255, 0, 0.3)',
  },
  placedText: {
    fontSize: 20,
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
});
