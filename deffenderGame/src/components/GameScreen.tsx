import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Dimensions, Text, Platform } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { Unit } from './Unit';
import { Monster } from './Monster';
import { Projectile } from './Projectile';
import { GameUI } from './GameUI';
import { UnitSelector } from './UnitSelector';
import { PathView } from './PathView';
import { PlacementGrid } from './PlacementGrid';
import { GameScene3D } from './GameScene3D';
import { DamageIndicator } from './DamageIndicator';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const GAME_WIDTH = width;
const TOP_UI_HEIGHT = 120;
const GAME_HEIGHT = height;

export const GameScreen: React.FC = () => {
  const { phase, units, monsters, projectiles, damageIndicators, placeUnit, selectedUnitType, updateGame, removeDamageIndicator, wave, preparationEndTime, gold } =
    useGameStore();
  
  const prevPhaseRef = useRef(phase);
  
  // phase 변경을 감지하여 preparing 전에 미리 Canvas 숨김
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // preparing 상태로 변경되기 직전 또는 변경 직후 즉시 처리
      if (phase === 'preparing' || (prevPhaseRef.current !== 'preparing' && phase === 'preparing')) {
        // 즉시 body/html을 검은색으로 변경
        document.body.style.setProperty('background-color', '#000000', 'important');
        document.documentElement.style.setProperty('background-color', '#000000', 'important');
        const rootElement = document.getElementById('root');
        if (rootElement) {
          rootElement.style.setProperty('background-color', '#000000', 'important');
        }
        
        // 즉시 모든 Canvas 숨기기 및 제거
        const allCanvases = document.querySelectorAll('canvas');
        allCanvases.forEach(canvas => {
          const el = canvas as HTMLElement;
          // WebGL 컨텍스트 종료
          try {
            const gl = el.getContext?.('webgl') || el.getContext?.('webgl2') || 
                      (el as any).getContext?.('experimental-webgl');
            if (gl) {
              const loseContext = gl.getExtension('WEBGL_lose_context');
              if (loseContext) {
                loseContext.loseContext();
              }
            }
          } catch (e) {}
          
          el.style.setProperty('display', 'none', 'important');
          el.style.setProperty('visibility', 'hidden', 'important');
          el.style.setProperty('opacity', '0', 'important');
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
        });
      }
      prevPhaseRef.current = phase;
    }
  }, [phase]);
  
  
  // 준비 시간 계산
  const [remainingPrepTime, setRemainingPrepTime] = useState(0);
  const preparingOverlayRef = useRef<HTMLDivElement | null>(null);
  
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
  
  // phase가 변경될 때마다 체크하여 preparing 상태 전에 미리 Canvas 숨김
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // 항상 body/html을 검은색으로 유지 (하얀 화면 방지)
      document.body.style.setProperty('background-color', '#000000', 'important');
      document.documentElement.style.setProperty('background-color', '#000000', 'important');
      const rootElement = document.getElementById('root');
      if (rootElement) {
        rootElement.style.setProperty('background-color', '#000000', 'important');
      }
    }
  }, [phase]);
  
  // 웹에서 preparing 상태일 때 body에 직접 DOM 삽입 (가장 먼저 실행)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (phase === 'preparing') {
        // 1. body/html을 즉시 완전히 검은색으로 변경 (가장 먼저!)
        document.body.style.setProperty('background-color', '#000000', 'important');
        document.body.style.setProperty('color', '#000000', 'important');
        document.documentElement.style.setProperty('background-color', '#000000', 'important');
        document.documentElement.style.setProperty('color', '#000000', 'important');
        
        const rootElement = document.getElementById('root');
        if (rootElement) {
          rootElement.style.setProperty('background-color', '#000000', 'important');
        }
        
        // 2. 모든 canvas를 즉시 제거하고 WebGL 컨텍스트 종료
        const hideAndRemoveCanvas = () => {
          const allCanvases = document.querySelectorAll('canvas');
          allCanvases.forEach(canvas => {
            const el = canvas as HTMLElement;
            // WebGL 컨텍스트 종료
            try {
              const gl = el.getContext?.('webgl') || el.getContext?.('webgl2') || 
                        (el as any).getContext?.('experimental-webgl');
              if (gl) {
                const loseContext = gl.getExtension('WEBGL_lose_context');
                if (loseContext) {
                  loseContext.loseContext();
                }
              }
            } catch (e) {}
            
            // 스타일 강제 적용
            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('visibility', 'hidden', 'important');
            el.style.setProperty('opacity', '0', 'important');
            el.style.setProperty('z-index', '-99999', 'important');
            el.style.setProperty('position', 'absolute', 'important');
            el.style.setProperty('top', '-99999px', 'important');
            el.style.setProperty('left', '-99999px', 'important');
            
            // DOM에서 완전히 제거
            if (el.parentNode) {
              el.parentNode.removeChild(el);
            }
          });
        };
        
        // 즉시 실행 (여러 번)
        hideAndRemoveCanvas();
        setTimeout(hideAndRemoveCanvas, 0);
        setTimeout(hideAndRemoveCanvas, 10);
        setTimeout(hideAndRemoveCanvas, 50);
        
        const intervalId = setInterval(hideAndRemoveCanvas, 100);
        
        // 3. body에 직접 DOM 삽입 (검은 배경 먼저, body의 첫 번째 자식으로)
        let overlay = document.getElementById('preparing-overlay') as HTMLDivElement;
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.id = 'preparing-overlay';
        }
        overlay.style.cssText = `
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          background-color: #000000 !important;
          z-index: 99999999 !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          pointer-events: auto !important;
        `;
        
        // body의 첫 번째 자식으로 추가 (가장 먼저 렌더링되도록)
        if (!overlay.parentNode) {
          document.body.insertBefore(overlay, document.body.firstChild);
        }
        
        const updateOverlay = () => {
          if (!preparationEndTime) return;
          const prepTime = wave % 5 === 0 ? 15 : 3;
          const remaining = Math.max(0, Math.ceil((preparationEndTime - Date.now()) / 1000));
          const progress = ((prepTime - remaining) / prepTime) * 100;
          
          overlay.innerHTML = `
            <div style="
              background-color: #141420;
              padding: 40px;
              border-radius: 25px;
              border: 4px solid #ffd700;
              min-width: 350px;
              text-align: center;
              box-shadow: 0px 0px 40px rgba(255, 215, 0, 0.6);
            ">
              ${wave % 5 === 0 ? `
                <div style="color: #ffd700; font-size: 42px; font-weight: bold; margin-bottom: 20px;">
                  🎉 ${wave}웨이브 클리어! 🎉
                </div>
                <div style="color: #fff; font-size: 18px; margin-top: 20px; line-height: 26px;">
                  새로운 맵 생성 중...<br/>
                  유닛 초기화 완료 후 배치 가능합니다
                </div>
              ` : `
                <div style="color: #ffd700; font-size: 42px; font-weight: bold; margin-bottom: 20px;">
                  🎉 ${wave}웨이브 클리어! 🎉
                </div>
              `}
              <div style="
                color: #4a90e2;
                font-size: 56px;
                font-weight: bold;
                margin: 30px 0;
                text-shadow: 0px 0px 30px rgba(74, 144, 226, 1), 3px 3px 6px rgba(0, 0, 0, 1);
              ">
                다음 라운드 준비중...
              </div>
              <div style="
                width: 280px;
                height: 8px;
                background-color: rgba(255, 255, 255, 0.2);
                border-radius: 4px;
                margin: 0 auto 30px;
                overflow: hidden;
              ">
                <div style="
                  height: 100%;
                  width: ${progress}%;
                  background-color: #ffd700;
                  border-radius: 4px;
                "></div>
              </div>
              <div style="
                background-color: rgba(255, 215, 0, 0.15);
                border-radius: 20px;
                padding: 25px;
                margin: 15px 0;
                border: 2px solid #ffd700;
              ">
                <div style="color: #ffd700; font-size: 72px; font-weight: bold;">
                  ${remaining}
                </div>
                <div style="color: #ffd700; font-size: 20px; margin-top: 8px;">
                  초
                </div>
              </div>
            </div>
          `;
          
          if (remaining > 0 && phase === 'preparing') {
            requestAnimationFrame(updateOverlay);
          }
        };
        
        preparingOverlayRef.current = overlay;
        updateOverlay();
        
        return () => {
          clearInterval(intervalId);
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        };
      } else {
        // preparing이 끝나면 overlay 제거
        const overlay = document.getElementById('preparing-overlay');
        if (overlay) {
          overlay.remove();
        }
        preparingOverlayRef.current = null;
      }
    }
  }, [phase, wave, preparationEndTime]);
  const animationFrameRef = useRef<number>();
  const lastUpdateTime = useRef<number>(Date.now());
  const pauseStartTime = useRef<number | null>(null); // pause 시작 시간 저장
  const containerRef = useRef<View>(null);
  const touchAreaRef = useRef<View>(null);
  const [touchAreaLayout, setTouchAreaLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  // 배경 애니메이션
  const bgOffset = useSharedValue(0);
  const bgAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: bgOffset.value }],
  }));

  useEffect(() => {
    bgOffset.value = withRepeat(
      withTiming(-GAME_WIDTH, { duration: 10000 }),
      -1,
      false
    );
  }, []);

  // 게임 루프
  useEffect(() => {
    if (phase !== 'playing') {
      // 일시정지 시 게임 루프 중지
      if (phase === 'paused' && pauseStartTime.current === null) {
        // pause 시작 시간 저장
        pauseStartTime.current = Date.now();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      return;
    }

    // resume 시: pause 중 경과한 시간만큼 lastUpdateTime을 조정
    if (pauseStartTime.current !== null) {
      const pauseDuration = Date.now() - pauseStartTime.current;
      // pause 중 시간은 게임 진행에 반영하지 않음 (lastUpdateTime 유지)
      pauseStartTime.current = null;
    } else {
      // 처음 시작 시에만 시간 초기화
      if (lastUpdateTime.current === 0) {
        lastUpdateTime.current = Date.now();
      }
    }

    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = now - lastUpdateTime.current;
      lastUpdateTime.current = now;

      // 첫 프레임이나 deltaTime이 비정상적으로 큰 경우 제한
      if (deltaTime > 1000 || deltaTime < 0) {
        // 첫 프레임이거나 시간이 역행한 경우 스킵
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      updateGame(deltaTime);
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [phase, updateGame]);

  const handleMouseMove = (e: any) => {
    // playing, paused, preparing 상태에서 마우스 위치 추적
    if (!selectedUnitType || (phase !== 'playing' && phase !== 'paused' && phase !== 'preparing')) {
      setMousePosition(null);
      return;
    }

    const clientX = e?.clientX || e?.nativeEvent?.clientX || 0;
    const clientY = e?.clientY || e?.nativeEvent?.clientY || 0;

    if (touchAreaLayout.width > 0 && touchAreaLayout.height > 0) {
      // touchArea 기준 상대 좌표
      const x = clientX - touchAreaLayout.x;
      const y = clientY - touchAreaLayout.y;
      // 절대 좌표로 변환 (PlacementGrid와 일치하도록)
      setMousePosition({ x, y: y + TOP_UI_HEIGHT });
    } else {
      setMousePosition({ x: clientX, y: clientY });
    }
  };

  const handleTouch = (event: any) => {
    // playing, paused, preparing 상태에서 유닛 배치 가능
    if ((phase !== 'playing' && phase !== 'paused' && phase !== 'preparing') || !selectedUnitType) {
      return;
    }

    const nativeEvent = event?.nativeEvent || {};
    let locationX: number = nativeEvent.locationX ?? 0;
    let locationY: number = nativeEvent.locationY ?? 0;

    // 웹에서는 locationX/Y가 제공되지 않을 수 있으므로 다른 방법 사용
    if (Platform.OS === 'web' && (locationX === 0 || locationY === 0)) {
      const syntheticEvent = event as any;
      let clientX = syntheticEvent.clientX || nativeEvent.clientX || 0;
      let clientY = syntheticEvent.clientY || nativeEvent.clientY || 0;
      
      if (clientX === 0 && clientY === 0) {
        clientX = nativeEvent.pageX || syntheticEvent.pageX || 0;
        clientY = nativeEvent.pageY || syntheticEvent.pageY || 0;
      }

      if (touchAreaLayout.width > 0 && touchAreaLayout.height > 0) {
        locationX = clientX - touchAreaLayout.x;
        locationY = clientY - touchAreaLayout.y;
      } else {
        locationX = clientX;
        locationY = clientY - TOP_UI_HEIGHT;
      }
    }

    // 그리드에 맞춰 정렬
    const GRID_SIZE = 50;
    
    // touchArea 기준 상대 좌표를 절대 좌표로 변환
    const absoluteX = locationX;
    const absoluteY = locationY + TOP_UI_HEIGHT; // touchArea는 top: 120이므로
    
    // 그리드 중앙에 정렬
    const gridCol = Math.floor(absoluteX / GRID_SIZE);
    const gridRow = Math.floor((absoluteY - TOP_UI_HEIGHT) / GRID_SIZE);
    const alignedX = gridCol * GRID_SIZE + GRID_SIZE / 2;
    const alignedY = TOP_UI_HEIGHT + gridRow * GRID_SIZE + GRID_SIZE / 2;

    const bottomUIHeight = 200;
    // 경계 체크 (절대 좌표 기준)
    if (alignedX < 0 || alignedY < TOP_UI_HEIGHT || alignedX > GAME_WIDTH || alignedY > height - bottomUIHeight) {
      return;
    }

    placeUnit({ x: alignedX, y: alignedY });
  };

  // 성 위치는 경로의 끝점
  const [castlePosition, setCastlePosition] = React.useState({ x: GAME_WIDTH - 80, y: height / 2 });
  
  React.useEffect(() => {
    const { setScreenSize, getPathPoints, setWave } = require('../config/pathConfig');
    setWave(wave); // 웨이브 설정
    setScreenSize(GAME_WIDTH, height);
    const pathPoints = getPathPoints();
    if (pathPoints.length > 0) {
      const lastPoint = pathPoints[pathPoints.length - 1];
      setCastlePosition({ x: lastPoint.x - 40, y: lastPoint.y - 40 });
    }
  }, [GAME_WIDTH, height, wave]);
  
  const castleX = castlePosition.x;
  const castleY = castlePosition.y;

  // preparing 상태일 때 body와 html 배경색도 변경 (웹만)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const html = document.documentElement;
      const hideCanvas = () => {
        // 즉시 모든 canvas 숨기기 (여러 번 실행)
        const allCanvases = document.querySelectorAll('canvas');
        allCanvases.forEach(canvas => {
          const el = canvas as HTMLElement;
          el.style.setProperty('display', 'none', 'important');
          el.style.setProperty('visibility', 'hidden', 'important');
          el.style.setProperty('opacity', '0', 'important');
          el.style.setProperty('z-index', '-99999', 'important');
          el.style.setProperty('pointer-events', 'none', 'important');
          el.style.setProperty('position', 'absolute', 'important');
          el.style.setProperty('top', '-99999px', 'important');
          el.style.setProperty('left', '-99999px', 'important');
        });
      };
      
      if (phase === 'preparing') {
        // CSS 스타일 태그 추가 (최강 수단) - 먼저 실행
        let styleTag = document.getElementById('preparing-background-style');
        if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = 'preparing-background-style';
          document.head.appendChild(styleTag);
        }
        styleTag.textContent = `
          body, html, #root, * { 
            background-color: #0a0a0f !important; 
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          canvas { 
            display: none !important; 
            visibility: hidden !important; 
            opacity: 0 !important; 
            z-index: -99999 !important; 
            pointer-events: none !important;
            position: absolute !important;
            top: -99999px !important;
            left: -99999px !important;
            background-color: #000000 !important;
          }
          [data-game-container] {
            background-color: #0a0a0f !important;
          }
        `;
        
        // 즉시 실행
        hideCanvas();
        // setInterval로 지속적으로 숨김
        const intervalId = setInterval(hideCanvas, 100);
        (window as any)._hideCanvasInterval = intervalId;
        
        // 여러 번 실행하여 확실히 숨김
        setTimeout(hideCanvas, 0);
        setTimeout(hideCanvas, 10);
        setTimeout(hideCanvas, 50);
        setTimeout(hideCanvas, 100);
        
        // body와 html 모두 배경색 강제 변경
        document.body.style.setProperty('background-color', '#0a0a0f', 'important');
        document.body.style.setProperty('overflow', 'hidden', 'important');
        document.body.style.setProperty('margin', '0', 'important');
        document.body.style.setProperty('padding', '0', 'important');
        html.style.setProperty('background-color', '#0a0a0f', 'important');
        html.style.setProperty('overflow', 'hidden', 'important');
        html.style.setProperty('margin', '0', 'important');
        html.style.setProperty('padding', '0', 'important');
        html.style.setProperty('width', '100%', 'important');
        html.style.setProperty('height', '100%', 'important');
        
        // 모든 자식 요소도 확인
        const rootElement = document.getElementById('root');
        if (rootElement) {
          rootElement.style.setProperty('background-color', '#0a0a0f', 'important');
          rootElement.style.setProperty('width', '100%', 'important');
          rootElement.style.setProperty('height', '100%', 'important');
          rootElement.style.setProperty('margin', '0', 'important');
          rootElement.style.setProperty('padding', '0', 'important');
        }
        
        return () => {
          // cleanup: interval 제거
          if ((window as any)._hideCanvasInterval) {
            clearInterval((window as any)._hideCanvasInterval);
            (window as any)._hideCanvasInterval = null;
          }
        };
      } else {
        // cleanup: interval 제거
        if ((window as any)._hideCanvasInterval) {
          clearInterval((window as any)._hideCanvasInterval);
          (window as any)._hideCanvasInterval = null;
        }
        
        // CSS 스타일 태그 제거
        const styleTag = document.getElementById('preparing-background-style');
        if (styleTag) {
          styleTag.remove();
        }
        
        // canvas 다시 표시 (GameScene3D가 처리)
        document.body.style.removeProperty('background-color');
        document.body.style.removeProperty('overflow');
        html.style.removeProperty('background-color');
        html.style.removeProperty('overflow');
        const rootElement = document.getElementById('root');
        if (rootElement) {
          rootElement.style.removeProperty('background-color');
        }
      }
    }
  }, [phase]);

  return (
    <View ref={containerRef} style={[styles.container, { 
      backgroundColor: phase === 'preparing' ? '#0a0a0f' : '#2c3e50',
      width: '100%',
      height: '100%',
      ...(phase === 'preparing' && Platform.OS === 'web' ? {
        position: 'fixed' as any,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      } : {}),
    }]} {...(Platform.OS === 'web' ? { 'data-game-container': true } : {})}>
      {/* 3D 게임 씬 - preparing 상태에서는 렌더링하지 않음 */}
      {phase !== 'preparing' && <GameScene3D />}
      {phase === 'preparing' && (
        <View style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#0a0a0f',
          zIndex: 1,
        }} />
      )}

      {/* 로딩 화면 - 웹에서는 DOM으로 직접 삽입, 네이티브에서만 React Native View 사용 */}
      {phase === 'preparing' && Platform.OS !== 'web' && (
        <View 
          style={{
            position: 'absolute' as any,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#0a0a0f',
            zIndex: 9999999,
            pointerEvents: 'auto',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* 로딩 애니메이션 배경 */}
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{ 
              color: 'rgba(255, 215, 0, 0.1)', 
              fontSize: 120, 
              fontWeight: 'bold',
              transform: [{ rotate: '45deg' }],
            }}>
              ⚔️
            </Text>
          </View>
          
          {/* 메인 컨텐츠 */}
          <View style={{
            backgroundColor: '#141420', // 완전히 불투명한 배경
            padding: 40,
            borderRadius: 25,
            borderWidth: 4,
            borderColor: '#ffd700',
            alignItems: 'center',
            minWidth: 350,
            zIndex: 1000000, // 최상위
            ...(Platform.OS === 'web' ? {
              boxShadow: '0px 0px 40px rgba(255, 215, 0, 0.6)',
            } : {
              shadowColor: '#ffd700',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 40,
              elevation: 25,
            }),
          }}>
            {/* 5의 배수 웨이브인지 확인 */}
            {wave % 5 === 0 ? (
              <>
                <Text style={{ color: '#ffd700', fontSize: 42, fontWeight: 'bold', marginBottom: 20 }}>
                  🎉 {wave}웨이브 클리어! 🎉
                </Text>
                <Text style={{ color: '#fff', fontSize: 18, marginTop: 20, textAlign: 'center', paddingHorizontal: 20, lineHeight: 26 }}>
                  새로운 맵 생성 중...{'\n'}
                  유닛 초기화 완료 후 배치 가능합니다
                </Text>
              </>
            ) : (
              <Text style={{ color: '#ffd700', fontSize: 42, fontWeight: 'bold', marginBottom: 20 }}>
                🎉 {wave}웨이브 클리어! 🎉
              </Text>
            )}
            
            {/* 다음 라운드 준비중 - 크게 표시 */}
            <Text style={{ 
              color: '#4a90e2', 
              fontSize: 56, 
              fontWeight: 'bold', 
              marginBottom: 30, 
              textAlign: 'center',
              marginTop: 10,
              ...(Platform.OS === 'web' ? {
                textShadow: '0px 0px 30px rgba(74, 144, 226, 1), 3px 3px 6px rgba(0, 0, 0, 1)',
              } : {
                textShadowColor: 'rgba(74, 144, 226, 1)',
                textShadowOffset: { width: 3, height: 3 },
                textShadowRadius: 30,
              }),
            }}>
              다음 라운드 준비중...
            </Text>
            
            {/* 로딩 바 */}
            <View style={{
              width: 280,
              height: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 4,
              marginBottom: 30,
              overflow: 'hidden',
            }}>
              <View style={{
                height: '100%',
                width: `${((preparationEndTime ? (wave % 5 === 0 ? 15 : 3) : 15) - remainingPrepTime) / (preparationEndTime ? (wave % 5 === 0 ? 15 : 3) : 15) * 100}%`,
                backgroundColor: '#ffd700',
                borderRadius: 4,
              }} />
            </View>
            
            {/* 시간 표시 */}
            <View style={{
              backgroundColor: 'rgba(255, 215, 0, 0.15)',
              borderRadius: 20,
              padding: 25,
              marginVertical: 15,
              borderWidth: 2,
              borderColor: '#ffd700',
            }}>
              <Text style={{ color: '#ffd700', fontSize: 72, fontWeight: 'bold', textAlign: 'center' }}>
                {remainingPrepTime}
              </Text>
              <Text style={{ color: '#ffd700', fontSize: 20, textAlign: 'center', marginTop: 8 }}>
                초
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* UI 레이어 - preparing 상태가 아닐 때만 표시 */}
      {phase !== 'preparing' && (
      <View style={styles.uiOverlay}>
        {/* 상단 UI */}
        <GameUI />
        
        {/* 하단 유닛 선택 */}
        <UnitSelector />
        
        {/* 배치 그리드 및 범위 표시 */}
        {selectedUnitType && <PlacementGrid mousePosition={mousePosition} />}
        
      {/* 데미지 인디케이터 */}
      {damageIndicators.map((indicator) => (
          <DamageIndicator
            key={indicator.id}
            damage={indicator.damage}
            position={indicator.position}
            type={indicator.type}
            onComplete={() => removeDamageIndicator(indicator.id)}
          />
        ))}
        
      </View>
      )}

      {/* 터치 영역 - 게임 필드만 */}
      {selectedUnitType && (
        <View
          ref={touchAreaRef}
          style={styles.touchArea}
          onLayout={(event) => {
            const layout = event.nativeEvent.layout;
            // 웹에서는 실제 DOM 요소의 getBoundingClientRect 사용
            if (Platform.OS === 'web' && touchAreaRef.current) {
              // 약간의 지연 후 DOM 요소가 준비되면 측정
              setTimeout(() => {
                try {
                  // @ts-ignore - 웹 DOM 접근
                  const node = (touchAreaRef.current as any)?._nativeNode || touchAreaRef.current;
                  if (node && typeof node.getBoundingClientRect === 'function') {
                    const rect = node.getBoundingClientRect();
                    setTouchAreaLayout({ 
                      x: rect.left, 
                      y: rect.top, 
                      width: rect.width, 
                      height: rect.height 
                    });
                    return;
                  }
                } catch (e) {
                  // 폴백
                }
                setTouchAreaLayout({ 
                  x: layout.x, 
                  y: layout.y, 
                  width: layout.width, 
                  height: layout.height 
                });
              }, 100);
            } else {
              setTouchAreaLayout({ 
                x: layout.x, 
                y: layout.y, 
                width: layout.width, 
                height: layout.height 
              });
            }
          }}
          {...(Platform.OS === 'web' ? {
            // 웹에서는 직접 mouse 이벤트 사용
            // @ts-ignore
            onMouseMove: handleMouseMove,
            // @ts-ignore
            onMouseDown: (e: React.MouseEvent) => {
              // 왼쪽 클릭만 유닛 배치 (우클릭/Alt+클릭/중간버튼은 카메라 조작)
              if (e.button === 0 && !e.altKey) {
                e.stopPropagation(); // 유닛 배치만 처리
                handleTouch(e);
              }
              // 우클릭/Alt+클릭/중간버튼은 stopPropagation 하지 않아서 canvas로 전달됨
            },
            // @ts-ignore
            onMouseLeave: () => {
              setMousePosition(null);
            },
            // @ts-ignore
            onContextMenu: (e: React.MouseEvent) => {
              // 우클릭 메뉴는 canvas에서 처리하므로 preventDefault 하지 않음
            },
            // @ts-ignore  
            onWheel: (e: React.WheelEvent) => {
              // 휠 이벤트는 카메라 확대/축소로 전달
              // stopPropagation 하지 않음
            },
          } : {
            // 네이티브에서는 Pressable 사용
            children: (
              <Pressable style={{ flex: 1 }} onPress={handleTouch}>
                <View style={{ flex: 1 }} />
              </Pressable>
            )
          })}
        >
          {Platform.OS !== 'web' && (
            <Pressable style={{ flex: 1 }} onPress={handleTouch}>
              <View style={{ flex: 1 }} />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c3e50', // 어두운 배경 (preparing일 때는 동적으로 변경됨)
    overflow: 'hidden',
    position: 'relative',
  },
  background: {
    position: 'absolute',
    flexDirection: 'row',
    width: GAME_WIDTH * 2,
    height: '100%',
  },
  backgroundTile: {
    width: GAME_WIDTH,
    height: '100%',
    backgroundColor: '#34495e',
    opacity: 0.6,
  },
  castle: {
    position: 'absolute',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  castleEmoji: {
    fontSize: 60,
  },
  placementArea: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    bottom: 200,
    borderWidth: 2,
    borderColor: '#4a90e2',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    zIndex: 0,
  },
  placementHint: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#4a90e2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  touchArea: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    bottom: 200,
    zIndex: 2000, // canvas보다 훨씬 위에
    backgroundColor: 'transparent',
    // 웹에서는 auto로 설정하되, 카메라 컨트롤 이벤트는 전역 리스너로 처리
    ...(Platform.OS === 'web' ? {
      pointerEvents: 'auto' as any,
    } : {}),
  },
  uiOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    // @ts-ignore - React Native Web box-none 지원
    ...(Platform.OS === 'web' ? {} : { pointerEvents: 'box-none' }),
  },
});
