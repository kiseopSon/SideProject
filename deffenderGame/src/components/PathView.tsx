import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { getPathPoints } from '../config/pathConfig';

export const PathView: React.FC = () => {
  const { width, height } = Dimensions.get('window');
  const PATH_POINTS = getPathPoints();
  
  // 화면 크기에 맞게 경로 설정
  React.useEffect(() => {
    const { setScreenSize } = require('../config/pathConfig');
    setScreenSize(width, height);
  }, [width, height]);

  // 경로를 시각적으로 표시
  const renderPath = () => {
    const pathElements: JSX.Element[] = [];
    const points = getPathPoints();
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      pathElements.push(
        <View
          key={`path-${i}`}
          style={[
            styles.pathSegment,
            {
              left: prev.x,
              top: prev.y,
              width: length,
              transform: [{ rotate: `${angle}deg` }],
            },
          ]}
        />
      );
      
      // 방향 화살표 추가 (경로 흐름 표시)
      if (i < points.length - 1) {
        const nextAngle = angle + 90; // 수직으로 회전
        const arrowX = prev.x + dx * 0.5;
        const arrowY = prev.y + dy * 0.5;
        
        pathElements.push(
          <View
            key={`arrow-${i}`}
            style={[
              styles.arrow,
              {
                left: arrowX - 8,
                top: arrowY - 8,
                transform: [{ rotate: `${angle}deg` }],
              },
            ]}
          />
        );
      }
      
      // 경로 포인트 표시
      if (i === points.length - 1) {
        // 끝점 표시 (성 위치)
        pathElements.push(
          <View
            key={`point-${i}`}
            style={[
              styles.endPoint,
              {
                left: curr.x - 8,
                top: curr.y - 8,
              },
            ]}
          />
        );
      }
    }
    
    return pathElements;
  };

  return <View style={styles.container}>{renderPath()}</View>;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  pathSegment: {
    position: 'absolute',
    height: 50,
    backgroundColor: 'rgba(184, 134, 11, 0.8)', // 황금색 경로
    borderWidth: 3,
    borderColor: 'rgba(255, 215, 0, 1)',
    borderStyle: 'solid',
    borderTopWidth: 3,
    borderBottomWidth: 3,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.5)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 4,
      elevation: 5,
    }),
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#ffd700',
  },
  endPoint: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e74c3c',
    borderWidth: 3,
    borderColor: '#fff',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 0px 8px rgba(231, 76, 60, 0.8)',
    } : {
      shadowColor: '#e74c3c',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 8,
      elevation: 10,
    }),
  },
});
