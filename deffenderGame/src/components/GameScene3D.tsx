import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { GLView } from 'expo-gl';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { getPositionOnPath, getPathPoints, setScreenSize } from '../config/pathConfig';
import { UNIT_CONFIGS } from '../config/unitConfigs';
import { MONSTER_CONFIGS } from '../config/monsterConfigs';

// 간단한 카메라 컨트롤 인터페이스
interface SimpleCameraControls {
  isMouseDown: boolean;
  lastMouseX: number;
  lastMouseY: number;
  rotationX: number;
  rotationY: number;
  distance: number;
}

const { width, height } = Dimensions.get('window');
const GAME_WIDTH = width;
const GAME_HEIGHT = height;

interface Unit3D {
  id: string;
  mesh: THREE.Object3D;
  type: string;
  color: number;
  attackEffect?: THREE.Mesh;
}

interface Monster3D {
  id: string;
  mesh: THREE.Mesh;
  type: string;
  color: number;
  isBoss: boolean;
  healthBar?: {
    background: THREE.Mesh;
    foreground: THREE.Mesh;
  };
}

interface Projectile3D {
  id: string;
  mesh: THREE.Mesh;
}

export const GameScene3D: React.FC = () => {
  const { phase, selectedUnitType } = useGameStore();
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const glRef = useRef<any>(null);
  const animationFrameRef = useRef<number>();
  const controlsRef = useRef<SimpleCameraControls>({
    isMouseDown: false,
    lastMouseX: 0,
    lastMouseY: 0,
    rotationX: Math.PI / 4,
    rotationY: Math.PI / 4,
    distance: 35, // 더 멀리서 보기
  });
  
  const units3DRef = useRef<Map<string, Unit3D>>(new Map());
  const monsters3DRef = useRef<Map<string, Monster3D>>(new Map());
  const projectiles3DRef = useRef<Map<string, Projectile3D>>(new Map());
  
  const timeRef = useRef<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<View>(null);
  const isAnimatingRef = useRef<boolean>(false);

  const initializeThreeJS = () => {
    if (rendererRef.current) return; // 이미 초기화됨
    
    // 웹에서는 canvas를 직접 생성
    const canvas = document.createElement('canvas');
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '1';
    // 카메라 컨트롤을 위해 항상 pointerEvents 활성화
    canvas.style.pointerEvents = 'auto';
    
    // React Native View의 DOM 노드를 찾아서 추가
    if (typeof document !== 'undefined') {
      // GameScreen의 container를 찾기
      let containerElement: HTMLElement | null = null;
      
      // data attribute로 찾기
      containerElement = document.querySelector('[data-game-container]') as HTMLElement;
      
      // React Native View의 실제 DOM 노드 찾기
      if (!containerElement && containerRef.current) {
        try {
          // @ts-ignore
          const node = containerRef.current._nativeNode || containerRef.current;
          if (node && node.nodeType === 1) {
            containerElement = node;
          }
        } catch (e) {
          // 폴백
        }
      }
      
      // 최종적으로 body에 추가 (z-index로 제어)
      const target = containerElement || document.body;
      if (target) {
        target.appendChild(canvas);
      }
    }
    
    canvasRef.current = canvas;

    const renderer = new THREE.WebGLRenderer({ 
      canvas,
      antialias: false, // 안티앨리어싱 비활성화
      alpha: false,
      powerPreference: 'high-performance',
      logarithmicDepthBuffer: false // 로그 깊이 버퍼 비활성화로 성능 향상
    });
    renderer.setSize(GAME_WIDTH, GAME_HEIGHT);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); // 픽셀 비율 낮춤
    renderer.setClearColor(0x0a0a0f, 1); // 어두운 배경색으로 변경 (하얀 화면 방지)
    // 그림자 맵 비활성화 (WebGL 텍스처 에러 방지 및 성능 향상)
    renderer.shadowMap.enabled = false;
    renderer.antialias = false; // 안티앨리어싱 비활성화로 성능 향상
    rendererRef.current = renderer;

    setupScene();
  };

  const onGLContextCreate = async (gl: any) => {
    if (Platform.OS === 'web') {
      // 웹에서는 별도로 처리
      initializeThreeJS();
      return;
    }

    // 네이티브: expo-gl 사용
    glRef.current = gl;
    const { width: glWidth, height: glHeight } = gl.getDrawingBufferSize();
    
    const renderer = new THREE.WebGLRenderer({
      canvas: {
        width: glWidth,
        height: glHeight,
        style: {},
        addEventListener: () => {},
        removeEventListener: () => {},
        clientHeight: glHeight,
        clientWidth: glWidth,
        getContext: () => gl,
      } as any,
      context: gl,
      antialias: true,
    });
    
    renderer.setSize(glWidth, glHeight);
    renderer.setClearColor(0x1a1a1a, 1);
    // 그림자 맵 비활성화 (WebGL 텍스처 에러 방지 및 성능 향상)
    renderer.shadowMap.enabled = false;
    rendererRef.current = renderer;

    setupScene();
  };

  const setupScene = () => {
    if (!rendererRef.current) {
      console.error('Renderer가 없습니다');
      return;
    }

    // 씬 생성
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 카메라 설정 (더 넓게 보이도록)
    const camera = new THREE.PerspectiveCamera(60, GAME_WIDTH / GAME_HEIGHT, 0.1, 1000);
    // 초기 카메라 위치는 controlsRef의 값에 맞춰 설정
    const initialControls = controlsRef.current;
    const x = initialControls.distance * Math.sin(initialControls.rotationX) * Math.cos(initialControls.rotationY);
    const y = initialControls.distance * Math.cos(initialControls.rotationX);
    const z = initialControls.distance * Math.sin(initialControls.rotationX) * Math.sin(initialControls.rotationY);
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 간단한 카메라 컨트롤 설정 (웹만)
    if (Platform.OS === 'web' && canvasRef.current) {
      const controls = controlsRef.current;
      
      const onMouseDown = (e: MouseEvent) => {
        // 유닛 선택 중이 아닐 때만 좌클릭으로 카메라 조작
        const currentState = useGameStore.getState();
        if (!currentState.selectedUnitType && e.button === 0 && !e.altKey) {
          // 좌클릭 드래그로 카메라 회전 (유닛 선택 중이 아닐 때)
          e.preventDefault();
          e.stopPropagation();
          controls.isMouseDown = true;
          controls.lastMouseX = e.clientX;
          controls.lastMouseY = e.clientY;
        }
        // 우클릭 또는 Alt+좌클릭은 항상 카메라 조작
        if (e.button === 2 || (e.button === 0 && e.altKey)) {
          e.preventDefault();
          e.stopPropagation();
          controls.isMouseDown = true;
          controls.lastMouseX = e.clientX;
          controls.lastMouseY = e.clientY;
        }
      };
      
      const onMouseMove = (e: MouseEvent) => {
        if (!controls.isMouseDown) return;
        
        e.preventDefault();
        e.stopPropagation();
        const deltaX = e.clientX - controls.lastMouseX;
        const deltaY = e.clientY - controls.lastMouseY;
        
        controls.rotationY += deltaX * 0.015; // 더 빠른 회전
        controls.rotationX += deltaY * 0.015;
        controls.rotationX = Math.max(0.1, Math.min(Math.PI / 2, controls.rotationX));
        
        controls.lastMouseX = e.clientX;
        controls.lastMouseY = e.clientY;
      };
      
      const onMouseUp = () => {
        controls.isMouseDown = false;
      };
      
      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        controls.distance += e.deltaY * 0.02;
        controls.distance = Math.max(15, Math.min(60, controls.distance));
      };
      
      const onContextMenu = (e: MouseEvent) => {
        e.preventDefault(); // 우클릭 메뉴 방지
      };
      
      // 전역 이벤트 리스너 등록 (touchArea를 통과하여 작동)
      const globalMouseMove = (e: MouseEvent) => {
        if (!controls.isMouseDown) return;
        
        e.preventDefault();
        e.stopPropagation();
        const deltaX = e.clientX - controls.lastMouseX;
        const deltaY = e.clientY - controls.lastMouseY;
        
        controls.rotationY += deltaX * 0.015;
        controls.rotationX += deltaY * 0.015;
        controls.rotationX = Math.max(0.1, Math.min(Math.PI / 2, controls.rotationX));
        
        controls.lastMouseX = e.clientX;
        controls.lastMouseY = e.clientY;
      };
      
      const globalMouseUp = () => {
        controls.isMouseDown = false;
      };
      
      // 전역 이벤트 리스너로 등록 (touchArea와 관계없이 작동, 캡처 단계, passive: false)
      // passive: false로 설정하여 preventDefault() 사용 가능
      document.addEventListener('mousedown', onMouseDown, { capture: true, passive: false } as AddEventListenerOptions);
      window.addEventListener('mousemove', globalMouseMove, { capture: true, passive: false } as AddEventListenerOptions);
      window.addEventListener('mouseup', globalMouseUp, { capture: true, passive: false } as AddEventListenerOptions);
      window.addEventListener('wheel', onWheel, { capture: true, passive: false } as AddEventListenerOptions);
      document.addEventListener('contextmenu', onContextMenu, { capture: true, passive: false } as AddEventListenerOptions);
      
      
      // 정리 함수 저장
      (canvasRef.current as any)._cleanupCameraControls = () => {
        document.removeEventListener('mousedown', onMouseDown, { capture: true, passive: false } as EventListenerOptions);
        window.removeEventListener('mousemove', globalMouseMove, { capture: true, passive: false } as EventListenerOptions);
        window.removeEventListener('mouseup', globalMouseUp, { capture: true, passive: false } as EventListenerOptions);
        window.removeEventListener('wheel', onWheel, { capture: true, passive: false } as EventListenerOptions);
        document.removeEventListener('contextmenu', onContextMenu, { capture: true, passive: false } as EventListenerOptions);
      };
    }

    // 조명 (더 밝게, 입체감 향상)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(15, 20, 10);
    directionalLight.castShadow = false;
    scene.add(directionalLight);

    // 추가 조명 (입체감 향상)
    const pointLight1 = new THREE.PointLight(0xffffff, 0.8, 100);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0x4a90e2, 0.6, 100);
    pointLight2.position.set(-10, 8, -10);
    scene.add(pointLight2);

    // 맵 타일 생성 (성능 최적화)
    setScreenSize(GAME_WIDTH, GAME_HEIGHT);
    const tileSize = 2; // 타일 크기 증가로 타일 수 감소
    const cols = Math.floor(GAME_WIDTH / 20);
    const rows = Math.floor(GAME_HEIGHT / 20);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = (col * tileSize) - (cols * tileSize) / 2;
        const z = (row * tileSize) - (rows * tileSize) / 2;
        
        const geometry = new THREE.BoxGeometry(tileSize, 1, tileSize);
        const material = new THREE.MeshStandardMaterial({ color: 0x34495e, roughness: 0.8 });
        const tile = new THREE.Mesh(geometry, material);
        tile.position.set(x, -0.5, z);
        tile.receiveShadow = false; // 그림자 맵 비활성화
        scene.add(tile);
      }
    }

    // 경로 생성
    const pathPoints = getPathPoints();
    for (let i = 1; i < pathPoints.length; i++) {
      const prev = pathPoints[i - 1];
      const curr = pathPoints[i];
      
      // 경로 좌표 변환
      const x1 = (prev.x - GAME_WIDTH / 2) / 50;
      const z1 = -(prev.y - GAME_HEIGHT / 2) / 50;
      const x2 = (curr.x - GAME_WIDTH / 2) / 50;
      const z2 = -(curr.y - GAME_HEIGHT / 2) / 50;

      const dx = x2 - x1;
      const dz = z2 - z1;
      const length = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dz, dx);

      const geometry = new THREE.BoxGeometry(length, 0.5, 1.5);
      const material = new THREE.MeshStandardMaterial({ color: 0xb8860b, roughness: 0.7, metalness: 0.1 });
      const pathSegment = new THREE.Mesh(geometry, material);
      pathSegment.position.set((x1 + x2) / 2, 0, (z1 + z2) / 2);
      pathSegment.rotation.y = angle;
      pathSegment.receiveShadow = false; // 그림자 맵 비활성화
      scene.add(pathSegment);
    }

    // 성 생성
    if (pathPoints.length > 0) {
      const lastPoint = pathPoints[pathPoints.length - 1];
      const castleX = (lastPoint.x - GAME_WIDTH / 2) / 50;
      const castleZ = -(lastPoint.y - GAME_HEIGHT / 2) / 50;

      // 성 기반
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(2.5, 3, 1, 16),
        new THREE.MeshStandardMaterial({ color: 0x7f8c8d, metalness: 0.2, roughness: 0.8 })
      );
      base.position.set(castleX, 0.5, castleZ);
      base.receiveShadow = false; // 그림자 맵 비활성화
      scene.add(base);

      // 성 본체 (더 높고 크게)
      const castleBody = new THREE.Mesh(
        new THREE.BoxGeometry(4, 5, 4),
        new THREE.MeshStandardMaterial({ color: 0x95a5a6, metalness: 0.3, roughness: 0.7 })
      );
      castleBody.position.set(castleX, 3, castleZ);
      castleBody.castShadow = false; // 그림자 맵 비활성화
      scene.add(castleBody);

      // 성 지붕
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(3, 2, 8),
        new THREE.MeshStandardMaterial({ color: 0xc0392b, metalness: 0.5, roughness: 0.5 })
      );
      roof.position.set(castleX, 6.5, castleZ);
      roof.rotation.y = Math.PI / 8;
      roof.castShadow = false; // 그림자 맵 비활성화
      scene.add(roof);

      // 성 탑들 (4개 모서리에)
      const towerPositions = [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]];
      towerPositions.forEach(([dx, dz]) => {
        // 탑 본체
        const tower = new THREE.Mesh(
          new THREE.CylinderGeometry(0.6, 0.7, 3, 8),
          new THREE.MeshStandardMaterial({ color: 0x7f8c8d, metalness: 0.3, roughness: 0.7 })
        );
        tower.position.set(castleX + dx, 2, castleZ + dz);
        tower.castShadow = false; // 그림자 맵 비활성화
        scene.add(tower);
        
        // 탑 지붕
        const towerRoof = new THREE.Mesh(
          new THREE.ConeGeometry(0.7, 1, 8),
          new THREE.MeshStandardMaterial({ color: 0xe74c3c, metalness: 0.5, roughness: 0.5 })
        );
        towerRoof.position.set(castleX + dx, 4, castleZ + dz);
        towerRoof.castShadow = false; // 그림자 맵 비활성화
        scene.add(towerRoof);
        
        // 깃발
        const flag = new THREE.Mesh(
          new THREE.PlaneGeometry(0.4, 0.6),
          new THREE.MeshStandardMaterial({ color: 0x3498db, side: THREE.DoubleSide })
        );
        flag.position.set(castleX + dx, 4.5, castleZ + dz + 0.3);
        flag.rotation.y = Math.PI / 4;
        scene.add(flag);
      });

      // 성 입구
      const gate = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 2, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x8b4513, metalness: 0.8, roughness: 0.3 })
      );
      gate.position.set(castleX, 1.5, castleZ - 2.1);
      scene.add(gate);
    }

    // 스카이박스 추가 (그라데이션 스카이)
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x87ceeb) },
        bottomColor: { value: new THREE.Color(0xffffff) },
        offset: { value: 33 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);

    // 구름 효과 제거 (성능 최적화)

    // 그림자용 평면 (크기 축소) - ShadowMaterial 대신 MeshBasicMaterial 사용
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshBasicMaterial({ 
        color: 0x000000, 
        transparent: true, 
        opacity: 0.1,
        side: THREE.DoubleSide
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.receiveShadow = false; // 그림자 맵 비활성화
    scene.add(shadowPlane);

    // 애니메이션 루프 시작
    isAnimatingRef.current = true;
    const animate = () => {
      if (!sceneRef.current || !cameraRef.current || !rendererRef.current || !isAnimatingRef.current) {
        return;
      }

      // preparing 상태에서는 렌더링 완전히 중지 (하얀 화면 방지) - 가장 먼저 체크
      const currentPhase = useGameStore.getState().phase;
      if (currentPhase === 'preparing') {
        // Canvas를 즉시 숨김 (매 프레임마다)
        if (Platform.OS === 'web' && canvasRef.current) {
          canvasRef.current.style.setProperty('display', 'none', 'important');
          canvasRef.current.style.setProperty('visibility', 'hidden', 'important');
          canvasRef.current.style.setProperty('opacity', '0', 'important');
          canvasRef.current.style.setProperty('z-index', '-99999', 'important');
          canvasRef.current.style.setProperty('pointer-events', 'none', 'important');
        }
        
        // Renderer를 검은색으로 채우고 완전히 정지
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.setClearColor(0x000000, 1); // 완전히 검은색
          rendererRef.current.clear(); // 화면 지우기
          rendererRef.current.render(sceneRef.current, cameraRef.current); // 검은 화면 렌더링
        }
        
        // 렌더링 완전히 중지 - 아무것도 렌더링하지 않음
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      
      // playing 상태로 돌아왔을 때 배경색 복원
      if (rendererRef.current) {
        rendererRef.current.setClearColor(0x0a0a0f, 1);
      }

      // 카메라 컨트롤 업데이트 (웹만, 항상 실행)
      if (Platform.OS === 'web' && cameraRef.current) {
        const controls = controlsRef.current;
        const x = controls.distance * Math.sin(controls.rotationX) * Math.cos(controls.rotationY);
        const y = controls.distance * Math.cos(controls.rotationX);
        const z = controls.distance * Math.sin(controls.rotationX) * Math.sin(controls.rotationY);
        
        cameraRef.current.position.set(x, y, z);
        cameraRef.current.lookAt(0, 0, 0);
      }

      timeRef.current += 0.016; // 약 60fps

      // Store에서 최신 상태 가져오기
      const currentState = useGameStore.getState();
      
      // preparing 상태에서는 이미 위에서 처리되므로 여기서는 건너뜀
      // (유닛/몬스터/투사체 생성/업데이트 로직은 실행하지 않음)
      if (currentState.phase === 'preparing') {
        // 맵만 렌더링 (유닛은 이미 제거됨)
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      
      const units = currentState.units;
      const monsters = currentState.monsters;
      const projectiles = currentState.projectiles;
      
      // preparing 상태가 아닐 때만 유닛 생성 (안전 체크)
      if (currentState.phase !== 'playing') {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      // 유닛 업데이트
      units.forEach((unit) => {
        let unit3D = units3DRef.current.get(unit.id);
        if (!unit3D) {
          const unitGroup = new THREE.Group();
          
          // 각 유닛 타입별 고유한 모델 생성
          // 레벨에 따른 색상 변화 (레벨이 높을수록 밝고 금색 느낌)
          const level = unit.level || 1;
          const levelColorMultiplier = Math.min(1.5, 1 + (level - 1) * 0.15); // 레벨마다 15% 밝기 증가 (최대 1.5배)
          
          if (unit.type === 'archer') {
            // 궁수: 화려한 전사 복장
            // 몸체 (로브) - 레벨에 따라 색상 변화
            const baseColor = new THREE.Color(0x1976d2);
            if (level > 1) {
              baseColor.lerp(new THREE.Color(0xffd700), (level - 1) * 0.15); // 금색으로 변화
            }
            
            const body = new THREE.Mesh(
              new THREE.CylinderGeometry(0.5, 0.6, 1.4, 32),
              new THREE.MeshStandardMaterial({ 
                color: level > 1 ? baseColor : 0x1976d2, 
                metalness: level > 1 ? 0.6 : 0.3, 
                roughness: level > 1 ? 0.3 : 0.6,
                emissive: level > 2 ? 0xffd700 : 0x000000,
                emissiveIntensity: level > 2 ? 0.3 : 0
              })
            );
            body.position.y = 0.7;
            unitGroup.add(body);
            
            // 갑옷 벨트
            const belt = new THREE.Mesh(
              new THREE.TorusGeometry(0.55, 0.08, 8, 16),
              new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 })
            );
            belt.rotation.x = Math.PI / 2;
            belt.position.y = 0.5;
            unitGroup.add(belt);
            
            // 활 (더 큰 활)
            const bow = new THREE.Mesh(
              new THREE.TorusGeometry(0.6, 0.12, 12, 24),
              new THREE.MeshStandardMaterial({ color: 0x8b4513, metalness: 0.4, roughness: 0.6 })
            );
            bow.rotation.z = Math.PI / 2;
            bow.position.set(0.4, 1.3, 0);
            unitGroup.add(bow);
            
            // 화살통
            const quiver = new THREE.Mesh(
              new THREE.CylinderGeometry(0.08, 0.12, 0.8, 8),
              new THREE.MeshStandardMaterial({ color: 0x654321, metalness: 0.2, roughness: 0.8 })
            );
            quiver.rotation.z = -0.3;
            quiver.position.set(-0.6, 0.8, 0);
            unitGroup.add(quiver);
            
            // 투구 (관우 스타일)
            const helmet = new THREE.Mesh(
              new THREE.ConeGeometry(0.4, 0.5, 12),
              new THREE.MeshStandardMaterial({ color: 0xc62828, metalness: 0.8, roughness: 0.2 })
            );
            helmet.position.y = 1.6;
            unitGroup.add(helmet);
            
            // 투구 장식 (빨간 깃털)
            const plume = new THREE.Mesh(
              new THREE.ConeGeometry(0.08, 0.6, 8),
              new THREE.MeshStandardMaterial({ color: 0xd32f2f, emissive: 0xff0000, emissiveIntensity: 0.3 })
            );
            plume.position.set(0, 2.2, 0);
            unitGroup.add(plume);
            
            // 어깨 갑옷
            const shoulderPad1 = new THREE.Mesh(
              new THREE.BoxGeometry(0.3, 0.2, 0.4),
              new THREE.MeshStandardMaterial({ color: 0x1565c0, metalness: 0.9, roughness: 0.1 })
            );
            shoulderPad1.position.set(-0.5, 1.3, 0);
            unitGroup.add(shoulderPad1);
            
            const shoulderPad2 = new THREE.Mesh(
              new THREE.BoxGeometry(0.3, 0.2, 0.4),
              new THREE.MeshStandardMaterial({ color: 0x1565c0, metalness: 0.9, roughness: 0.1 })
            );
            shoulderPad2.position.set(0.5, 1.3, 0);
            unitGroup.add(shoulderPad2);
          } else if (unit.type === 'wizard') {
            // 마법사: 화려한 마법사 복장
            // 몸체 (긴 로브)
            const body = new THREE.Mesh(
              new THREE.ConeGeometry(0.6, 1.8, 12),
              new THREE.MeshStandardMaterial({ color: 0x7b1fa2, metalness: 0.3, roughness: 0.7 })
            );
            body.position.y = 0.9;
            unitGroup.add(body);
            
            // 로브 장식 (별 문양)
            const star1 = new THREE.Mesh(
              new THREE.OctahedronGeometry(0.08, 0),
              new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffff00, emissiveIntensity: 0.8 })
            );
            star1.position.set(0.3, 1.0, 0.3);
            unitGroup.add(star1);
            
            const star2 = new THREE.Mesh(
              new THREE.OctahedronGeometry(0.08, 0),
              new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffff00, emissiveIntensity: 0.8 })
            );
            star2.position.set(-0.3, 1.0, 0.3);
            unitGroup.add(star2);
            
            // 화려한 마법봉
            const staff = new THREE.Mesh(
              new THREE.CylinderGeometry(0.06, 0.08, 1.8, 12),
              new THREE.MeshStandardMaterial({ color: 0x4a148c, metalness: 0.7, roughness: 0.3 })
            );
            staff.position.set(0.7, 1.3, 0);
            unitGroup.add(staff);
            
            // 마법 구슬 (빛나는)
            const orb = new THREE.Mesh(
              new THREE.SphereGeometry(0.2, 16, 16),
              new THREE.MeshStandardMaterial({ 
                color: 0xff00ff, 
                emissive: 0xff00ff, 
                emissiveIntensity: 1.5,
                metalness: 1.0,
                roughness: 0.1
              })
            );
            orb.position.set(0.7, 2.3, 0);
            unitGroup.add(orb);
            
            // 후광 효과
            const aura = new THREE.Mesh(
              new THREE.RingGeometry(0.25, 0.35, 16),
              new THREE.MeshStandardMaterial({ 
                color: 0xff00ff, 
                emissive: 0xff00ff, 
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide
              })
            );
            aura.rotation.x = -Math.PI / 2;
            aura.position.set(0.7, 2.3, 0);
            unitGroup.add(aura);
            
            // 모자 (뾰족한 모자)
            const hat = new THREE.Mesh(
              new THREE.ConeGeometry(0.35, 0.8, 12),
              new THREE.MeshStandardMaterial({ color: 0x4a148c, metalness: 0.4, roughness: 0.6 })
            );
            hat.position.y = 2.0;
            unitGroup.add(hat);
            
            // 모자 장식
            const hatStar = new THREE.Mesh(
              new THREE.OctahedronGeometry(0.12, 0),
              new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffff00, emissiveIntensity: 1.0 })
            );
            hatStar.position.set(0, 2.5, 0);
            unitGroup.add(hatStar);
          } else if (unit.type === 'tank') {
            // 탱크: 화려한 기사 복장 (관우 스타일)
            // 몸체 (갑옷) - 부드럽게 (Sphere + Cylinder 조합)
            const bodyTop = new THREE.Mesh(
              new THREE.SphereGeometry(0.45, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
              new THREE.MeshStandardMaterial({ color: 0xff6f00, metalness: 0.95, roughness: 0.05 })
            );
            bodyTop.position.y = 1.05;
            unitGroup.add(bodyTop);
            
            const bodyCylinder = new THREE.Mesh(
              new THREE.CylinderGeometry(0.45, 0.45, 1.0, 16),
              new THREE.MeshStandardMaterial({ color: 0xff6f00, metalness: 0.95, roughness: 0.05 })
            );
            bodyCylinder.position.y = 0.3;
            unitGroup.add(bodyCylinder);
            
            const body = bodyCylinder; // 참조 유지
            // body는 이미 추가됨
            
            // 갑옷 장식 (황금 트림)
            const trim1 = new THREE.Mesh(
              new THREE.TorusGeometry(0.5, 0.05, 8, 16),
              new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1.0, roughness: 0.1 })
            );
            trim1.rotation.x = Math.PI / 2;
            trim1.position.set(0, 1.0, 0.46);
            unitGroup.add(trim1);
            
            const trim2 = new THREE.Mesh(
              new THREE.TorusGeometry(0.5, 0.05, 8, 16),
              new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1.0, roughness: 0.1 })
            );
            trim2.rotation.x = Math.PI / 2;
            trim2.position.set(0, 0.5, 0.46);
            unitGroup.add(trim2);
            
            // 거대한 방패 (용 문양 느낌)
            const shield = new THREE.Mesh(
              new THREE.OctahedronGeometry(0.7, 0),
              new THREE.MeshStandardMaterial({ color: 0xe65100, metalness: 0.9, roughness: 0.2 })
            );
            shield.rotation.z = Math.PI / 4;
            shield.position.set(-0.7, 1.1, 0);
            unitGroup.add(shield);
            
            // 방패 중심 장식
            const shieldCenter = new THREE.Mesh(
              new THREE.SphereGeometry(0.2, 16, 16),
              new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1.0, roughness: 0.1, emissive: 0xffaa00, emissiveIntensity: 0.3 })
            );
            shieldCenter.position.set(-0.7, 1.1, 0.1);
            unitGroup.add(shieldCenter);
            
            // 화려한 투구
            const helmet = new THREE.Mesh(
              new THREE.SphereGeometry(0.5, 16, 16),
              new THREE.MeshStandardMaterial({ color: 0xff6f00, metalness: 0.95, roughness: 0.1 })
            );
            helmet.scale.y = 0.75;
            helmet.position.y = 1.65;
            unitGroup.add(helmet);
            
            // 투구 장식 (빨간 깃털)
            const helmetPlume = new THREE.Mesh(
              new THREE.ConeGeometry(0.1, 0.8, 8),
              new THREE.MeshStandardMaterial({ color: 0xc62828, emissive: 0xff0000, emissiveIntensity: 0.4 })
            );
            helmetPlume.position.set(0, 2.3, 0);
            unitGroup.add(helmetPlume);
            
            // 어깨 갑옷 (용 문양)
            const shoulder1 = new THREE.Mesh(
              new THREE.BoxGeometry(0.4, 0.3, 0.5),
              new THREE.MeshStandardMaterial({ color: 0xff6f00, metalness: 0.95, roughness: 0.1 })
            );
            shoulder1.position.set(-0.6, 1.5, 0);
            unitGroup.add(shoulder1);
            
            const shoulder2 = new THREE.Mesh(
              new THREE.BoxGeometry(0.4, 0.3, 0.5),
              new THREE.MeshStandardMaterial({ color: 0xff6f00, metalness: 0.95, roughness: 0.1 })
            );
            shoulder2.position.set(0.6, 1.5, 0);
            unitGroup.add(shoulder2);
            
            // 검 (관우의 청룡언월도 스타일)
            const sword = new THREE.Mesh(
              new THREE.BoxGeometry(0.1, 1.2, 0.05),
              new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 1.0, roughness: 0.1, emissive: 0xffffff, emissiveIntensity: 0.2 })
            );
            sword.position.set(0.7, 1.3, 0);
            sword.rotation.z = -0.2;
            unitGroup.add(sword);
          } else if (unit.type === 'healer') {
            // 힐러: 화려한 성직자 복장
            // 몸체 (긴 로브)
            const body = new THREE.Mesh(
              new THREE.CylinderGeometry(0.5, 0.6, 1.6, 12),
              new THREE.MeshStandardMaterial({ color: 0x66bb6a, metalness: 0.2, roughness: 0.8 })
            );
            body.position.y = 0.8;
            unitGroup.add(body);
            
            // 로브 장식 (금색 트림)
            const trim1 = new THREE.Mesh(
              new THREE.TorusGeometry(0.55, 0.06, 8, 16),
              new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 })
            );
            trim1.rotation.x = Math.PI / 2;
            trim1.position.set(0, 1.2, 0.26);
            unitGroup.add(trim1);
            
            const trim2 = new THREE.Mesh(
              new THREE.TorusGeometry(0.55, 0.06, 8, 16),
              new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 })
            );
            trim2.rotation.x = Math.PI / 2;
            trim2.position.set(0, 0.6, 0.26);
            unitGroup.add(trim2);
            
            // 빛나는 십자가
            const cross = new THREE.Group();
            const vertical = new THREE.Mesh(
              new THREE.BoxGeometry(0.2, 1.0, 0.15),
              new THREE.MeshStandardMaterial({ 
                color: 0xffffff, 
                emissive: 0xffffff, 
                emissiveIntensity: 1.2,
                metalness: 0.8,
                roughness: 0.2
              })
            );
            const horizontal = new THREE.Mesh(
              new THREE.BoxGeometry(0.8, 0.2, 0.15),
              new THREE.MeshStandardMaterial({ 
                color: 0xffffff, 
                emissive: 0xffffff, 
                emissiveIntensity: 1.2,
                metalness: 0.8,
                roughness: 0.2
              })
            );
            horizontal.position.y = 0.2;
            cross.add(vertical);
            cross.add(horizontal);
            
            // 십자가 중심 보석
            const gem = new THREE.Mesh(
              new THREE.OctahedronGeometry(0.15, 0),
              new THREE.MeshStandardMaterial({ 
                color: 0x4caf50, 
                emissive: 0x4caf50, 
                emissiveIntensity: 1.5,
                metalness: 1.0,
                roughness: 0.1
              })
            );
            gem.position.y = 0.2;
            cross.add(gem);
            
            cross.position.set(0, 2.0, 0);
            unitGroup.add(cross);
            
            // 후광 효과
            const halo = new THREE.Mesh(
              new THREE.RingGeometry(0.6, 0.8, 16),
              new THREE.MeshStandardMaterial({ 
                color: 0xffffff, 
                emissive: 0xffffff, 
                emissiveIntensity: 0.8,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
              })
            );
            halo.rotation.x = -Math.PI / 2;
            halo.position.set(0, 2.5, 0);
            unitGroup.add(halo);
            
            // 모자 (주교 모자)
            const hat = new THREE.Mesh(
              new THREE.ConeGeometry(0.4, 0.6, 12),
              new THREE.MeshStandardMaterial({ color: 0x388e3c, metalness: 0.3, roughness: 0.7 })
            );
            hat.position.y = 2.1;
            unitGroup.add(hat);
          } else if (unit.type === 'assassin') {
            // 암살자: 닌자 스타일 (화려한)
            // 몸체 (날렵한)
            const body = new THREE.Mesh(
              new THREE.BoxGeometry(0.35, 1.2, 0.35),
              new THREE.MeshStandardMaterial({ color: 0x880e4f, metalness: 0.6, roughness: 0.4 })
            );
            body.position.y = 0.6;
            unitGroup.add(body);
            
            // 가슴 갑옷
            const chest = new THREE.Mesh(
              new THREE.BoxGeometry(0.4, 0.5, 0.2),
              new THREE.MeshStandardMaterial({ color: 0xc2185b, metalness: 0.8, roughness: 0.2 })
            );
            chest.position.set(0, 0.9, 0.18);
            unitGroup.add(chest);
            
            // 쌍검 (더 크고 화려하게)
            const dagger1 = new THREE.Mesh(
              new THREE.BoxGeometry(0.12, 0.8, 0.06),
              new THREE.MeshStandardMaterial({ 
                color: 0xc0c0c0, 
                metalness: 1.0, 
                roughness: 0.05,
                emissive: 0xffffff,
                emissiveIntensity: 0.3
              })
            );
            dagger1.position.set(-0.4, 1.3, 0);
            dagger1.rotation.z = 0.3;
            unitGroup.add(dagger1);
            
            const dagger2 = new THREE.Mesh(
              new THREE.BoxGeometry(0.12, 0.8, 0.06),
              new THREE.MeshStandardMaterial({ 
                color: 0xc0c0c0, 
                metalness: 1.0, 
                roughness: 0.05,
                emissive: 0xffffff,
                emissiveIntensity: 0.3
              })
            );
            dagger2.position.set(0.4, 1.3, 0);
            dagger2.rotation.z = -0.3;
            unitGroup.add(dagger2);
            
            // 후드 (더 크게)
            const hood = new THREE.Mesh(
              new THREE.ConeGeometry(0.4, 0.7, 12),
              new THREE.MeshStandardMaterial({ color: 0x880e4f, metalness: 0.3, roughness: 0.7 })
            );
            hood.position.y = 1.5;
            unitGroup.add(hood);
            
            // 마스크
            const mask = new THREE.Mesh(
              new THREE.BoxGeometry(0.3, 0.15, 0.05),
              new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.2, roughness: 0.8 })
            );
            mask.position.set(0, 1.5, 0.22);
            unitGroup.add(mask);
            
            // 어깨 갑옷
            const shoulder1 = new THREE.Mesh(
              new THREE.BoxGeometry(0.25, 0.15, 0.3),
              new THREE.MeshStandardMaterial({ color: 0xad1457, metalness: 0.9, roughness: 0.2 })
            );
            shoulder1.position.set(-0.3, 1.2, 0);
            unitGroup.add(shoulder1);
            
            const shoulder2 = new THREE.Mesh(
              new THREE.BoxGeometry(0.25, 0.15, 0.3),
              new THREE.MeshStandardMaterial({ color: 0xad1457, metalness: 0.9, roughness: 0.2 })
            );
            shoulder2.position.set(0.3, 1.2, 0);
            unitGroup.add(shoulder2);
          }
          
          unitGroup.castShadow = false; // 그림자 맵 비활성화
          // 적절한 스케일 (성능 고려)
          unitGroup.scale.set(1.2, 1.2, 1.2);
          unitGroup.userData.isUnit = true; // 유닛 식별자 추가
          unitGroup.userData.unitId = unit.id; // 유닛 ID 추가
          sceneRef.current!.add(unitGroup);
          
          const colors: Record<string, number> = {
            archer: 0x2196f3,
            wizard: 0x9c27b0,
            tank: 0xff9800,
            healer: 0x4caf50,
            assassin: 0xe91e63,
          };
          
          unit3D = { id: unit.id, mesh: unitGroup as any, type: unit.type, color: colors[unit.type] || 0xffffff };
          units3DRef.current.set(unit.id, unit3D);
        }
        
        // 2D 화면 좌표를 3D 좌표로 변환
        const x = (unit.position.x - GAME_WIDTH / 2) / 50;
        const z = -(unit.position.y - GAME_HEIGHT / 2) / 50;
        unit3D.mesh.position.set(x, 0, z);
        unit3D.mesh.rotation.y = Math.sin(timeRef.current * 0.5) * 0.1;
        
        // 레벨에 따른 시각적 피드백 업데이트
        const level = unit.level || 1;
        if (level > 1 && unit3D.mesh instanceof THREE.Group) {
          unit3D.mesh.children.forEach((child) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
              // 레벨이 높을수록 더 밝고 금색 느낌
              const levelColorMultiplier = 1 + (level - 1) * 0.2;
              const originalColor = child.material.color.clone();
              child.material.color.multiplyScalar(Math.min(levelColorMultiplier, 1.5));
              if (level > 2) {
                child.material.emissive.setHex(0xffd700);
                child.material.emissiveIntensity = 0.2;
              }
            }
          });
        }
        
        // 공격 시 애니메이션 효과 (lastAttackTime 체크)
        const timeSinceAttack = Date.now() - unit.lastAttackTime;
        if (timeSinceAttack < 300) { // 공격 후 0.3초 동안 이펙트
          const attackIntensity = 1 - (timeSinceAttack / 300);
          // 공격 모션 (약간 앞으로 이동)
          unit3D.mesh.position.y = Math.sin(attackIntensity * Math.PI) * 0.2;
          
          // 공격 이펙트 파티클 (간단한 빛나는 원)
          if (!unit3D.attackEffect) {
            const effectGeometry = new THREE.RingGeometry(0.5, 0.7, 16);
            const effectMaterial = new THREE.MeshStandardMaterial({
              color: unit3D.color,
              emissive: unit3D.color,
              emissiveIntensity: 1.0,
              transparent: true,
              opacity: 0.8,
              side: THREE.DoubleSide
            });
            const effect = new THREE.Mesh(effectGeometry, effectMaterial);
            effect.rotation.x = -Math.PI / 2;
            effect.position.set(x, 0.1, z);
            sceneRef.current!.add(effect);
            unit3D.attackEffect = effect;
          } else {
            unit3D.attackEffect.position.set(x, 0.1, z);
            unit3D.attackEffect.scale.set(1 + attackIntensity * 0.5, 1 + attackIntensity * 0.5, 1);
            (unit3D.attackEffect.material as THREE.MeshStandardMaterial).opacity = 0.8 * (1 - attackIntensity);
          }
        } else if (unit3D.attackEffect && unit3D.attackEffect.geometry) {
          // 이펙트 제거
          sceneRef.current!.remove(unit3D.attackEffect);
          if (unit3D.attackEffect.geometry) {
            unit3D.attackEffect.geometry.dispose();
          }
          if (unit3D.attackEffect.material) {
            if (Array.isArray(unit3D.attackEffect.material)) {
              unit3D.attackEffect.material.forEach(m => m.dispose());
            } else {
              unit3D.attackEffect.material.dispose();
            }
          }
          unit3D.attackEffect = undefined;
        }
      });

      // preparing 상태에서는 이미 위에서 처리되므로 여기서는 건너뜀
      // (유닛/몬스터/투사체 생성/업데이트 로직은 실행하지 않음)

      // 사라진 유닛 제거
      units3DRef.current.forEach((unit3D, id) => {
        if (!units.find((u) => u.id === id)) {
          // 이펙트 제거
          if (unit3D.attackEffect) {
            sceneRef.current!.remove(unit3D.attackEffect);
            unit3D.attackEffect.geometry.dispose();
            if (Array.isArray(unit3D.attackEffect.material)) {
              unit3D.attackEffect.material.forEach(m => m.dispose());
            } else {
              unit3D.attackEffect.material.dispose();
            }
          }
          // 유닛 메시 제거
          sceneRef.current!.remove(unit3D.mesh);
          if (unit3D.mesh instanceof THREE.Group) {
            unit3D.mesh.children.forEach((child) => {
              if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                  child.material.forEach(m => m.dispose());
                } else {
                  child.material.dispose();
                }
              }
            });
          } else if (unit3D.mesh instanceof THREE.Mesh) {
            unit3D.mesh.geometry.dispose();
            if (Array.isArray(unit3D.mesh.material)) {
              unit3D.mesh.material.forEach(m => m.dispose());
            } else {
              unit3D.mesh.material.dispose();
            }
          }
          units3DRef.current.delete(id);
        }
      });

      // 몬스터 업데이트
      monsters.forEach((monster) => {
        let monster3D = monsters3DRef.current.get(monster.id);
        if (!monster3D) {
          const monsterGroup = new THREE.Group();
          
          if (monster.type === 'normal') {
            // 일반 몬스터: 작은 괴물
            const body = new THREE.Mesh(
              new THREE.OctahedronGeometry(0.6, 0),
              new THREE.MeshStandardMaterial({ 
                color: 0xef5350, 
                emissive: 0xff0000, 
                emissiveIntensity: 0.3,
                metalness: 0.5,
                roughness: 0.4
              })
            );
            monsterGroup.add(body);
            
            // 눈 추가
            const eye1 = new THREE.Mesh(
              new THREE.SphereGeometry(0.1, 8, 8),
              new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 1.0 })
            );
            eye1.position.set(-0.2, 0.3, 0.5);
            monsterGroup.add(eye1);
            
            const eye2 = new THREE.Mesh(
              new THREE.SphereGeometry(0.1, 8, 8),
              new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 1.0 })
            );
            eye2.position.set(0.2, 0.3, 0.5);
            monsterGroup.add(eye2);
          } else if (monster.type === 'fast') {
            // 빠른 몬스터: 날렵한 형태
            const body = new THREE.Mesh(
              new THREE.ConeGeometry(0.5, 1.0, 6),
              new THREE.MeshStandardMaterial({ 
                color: 0xff9800, 
                emissive: 0xff6600, 
                emissiveIntensity: 0.4,
                metalness: 0.6,
                roughness: 0.3
              })
            );
            body.rotation.x = Math.PI;
            body.position.y = 0.5;
            monsterGroup.add(body);
            
            // 꼬리 (부드럽게)
            const tail = new THREE.Mesh(
              new THREE.CylinderGeometry(0.15, 0.2, 0.8, 12),
              new THREE.MeshStandardMaterial({ color: 0xff6600 })
            );
            tail.position.set(0, 0.4, -0.5);
            tail.rotation.x = -0.3;
            monsterGroup.add(tail);
          } else if (monster.type === 'tank') {
            // 탱크 몬스터: 큰 덩치 (부드럽게)
            const body = new THREE.Mesh(
              new THREE.OctahedronGeometry(0.85, 0),
              new THREE.MeshStandardMaterial({ 
                color: 0x757575, 
                emissive: 0x424242, 
                emissiveIntensity: 0.2,
                metalness: 0.8,
                roughness: 0.2
              })
            );
            body.position.y = 0.6;
            monsterGroup.add(body);
            
            // 갑옷 장식 (부드럽게)
            const armor1 = new THREE.Mesh(
              new THREE.CylinderGeometry(0.7, 0.7, 0.3, 16),
              new THREE.MeshStandardMaterial({ color: 0x616161 })
            );
            armor1.rotation.x = Math.PI / 2;
            armor1.position.set(0, 1.0, 0.6);
            monsterGroup.add(armor1);
            
            const armor2 = new THREE.Mesh(
              new THREE.CylinderGeometry(0.7, 0.7, 0.3, 16),
              new THREE.MeshStandardMaterial({ color: 0x616161 })
            );
            armor2.rotation.x = Math.PI / 2;
            armor2.position.set(0, 0.3, 0.6);
            monsterGroup.add(armor2);
          } else if (monster.type === 'boss') {
            // 보스: 거대한 드래곤 형태
            const body = new THREE.Mesh(
              new THREE.SphereGeometry(1.5, 16, 16),
              new THREE.MeshStandardMaterial({ 
                color: 0x9c27b0, 
                emissive: 0x6a1b9a, 
                emissiveIntensity: 0.5,
                metalness: 0.7,
                roughness: 0.3
              })
            );
            monsterGroup.add(body);
            
            // 날개 (부드럽게)
            const wing1 = new THREE.Mesh(
              new THREE.ConeGeometry(0.4, 1.5, 8),
              new THREE.MeshStandardMaterial({ color: 0x7b1fa2 })
            );
            wing1.position.set(-1.2, 0.5, 0);
            wing1.rotation.z = -0.5;
            wing1.rotation.y = Math.PI / 2;
            monsterGroup.add(wing1);
            
            const wing2 = new THREE.Mesh(
              new THREE.ConeGeometry(0.4, 1.5, 8),
              new THREE.MeshStandardMaterial({ color: 0x7b1fa2 })
            );
            wing2.position.set(1.2, 0.5, 0);
            wing2.rotation.z = 0.5;
            wing2.rotation.y = Math.PI / 2;
            monsterGroup.add(wing2);
            
            // 뿔
            const horn1 = new THREE.Mesh(
              new THREE.ConeGeometry(0.2, 0.8, 8),
              new THREE.MeshStandardMaterial({ color: 0x4a148c })
            );
            horn1.position.set(-0.5, 1.8, 0.5);
            monsterGroup.add(horn1);
            
            const horn2 = new THREE.Mesh(
              new THREE.ConeGeometry(0.2, 0.8, 8),
              new THREE.MeshStandardMaterial({ color: 0x4a148c })
            );
            horn2.position.set(0.5, 1.8, 0.5);
            monsterGroup.add(horn2);
            
            // 큰 눈 2개
            const eye1 = new THREE.Mesh(
              new THREE.SphereGeometry(0.3, 16, 16),
              new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1.0 })
            );
            eye1.position.set(-0.4, 0.5, 1.6);
            monsterGroup.add(eye1);
            
            const eye2 = new THREE.Mesh(
              new THREE.SphereGeometry(0.3, 16, 16),
              new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1.0 })
            );
            eye2.position.set(0.4, 0.5, 1.6);
            monsterGroup.add(eye2);
          }
          
          monsterGroup.castShadow = false; // 그림자 맵 비활성화
          // 적절한 스케일 (성능 고려)
          const monsterScale = monster.type === 'boss' ? 1.5 : 1.2;
          monsterGroup.scale.set(monsterScale, monsterScale, monsterScale);
          monsterGroup.userData.isMonster = true; // 몬스터 식별자 추가
          monsterGroup.userData.monsterId = monster.id; // 몬스터 ID 추가
          
          // 체력 바 생성 (3D Plane으로 몬스터 위에)
          const isBoss = monster.type === 'boss';
          const barWidth = isBoss ? 1.6 : 1.4;
          const barHeight = 0.15;
          
          // 배경
          const healthBarBg = new THREE.Mesh(
            new THREE.PlaneGeometry(barWidth, barHeight),
            new THREE.MeshBasicMaterial({ 
              color: 0x000000, 
              transparent: true, 
              opacity: 0.7,
              side: THREE.DoubleSide
            })
          );
          healthBarBg.position.set(0, (isBoss ? 2.5 : 2.0), 0);
          monsterGroup.add(healthBarBg);
          
          // 전경 (체력)
          const healthBarFg = new THREE.Mesh(
            new THREE.PlaneGeometry(barWidth, barHeight),
            new THREE.MeshBasicMaterial({ 
              color: 0x4caf50, 
              transparent: true, 
              opacity: 0.9,
              side: THREE.DoubleSide
            })
          );
          healthBarFg.position.set(0, (isBoss ? 2.5 : 2.0), 0.01);
          monsterGroup.add(healthBarFg);
          
          sceneRef.current!.add(monsterGroup);
          
          const colors: Record<string, number> = {
            normal: 0xef5350,
            fast: 0xff9800,
            tank: 0x757575,
            boss: 0x9c27b0,
          };
          
          monster3D = { 
            id: monster.id, 
            mesh: monsterGroup as any, 
            type: monster.type, 
            color: colors[monster.type] || 0xef5350, 
            isBoss,
            healthBar: {
              background: healthBarBg,
              foreground: healthBarFg,
            }
          };
          monsters3DRef.current.set(monster.id, monster3D);
        }
        
        // 2D 화면 좌표를 3D 좌표로 변환
        const x = (monster.position.x - GAME_WIDTH / 2) / 50;
        const z = -(monster.position.y - GAME_HEIGHT / 2) / 50;
        const bounce = monster.type === 'fast' ? Math.sin(timeRef.current * 4) * 0.2 : Math.sin(timeRef.current * 2) * 0.1;
        monster3D.mesh.position.set(x, 0.8 + bounce, z);
        monster3D.mesh.rotation.y += 0.02;
        
        // 체력 바 업데이트 (항상 카메라를 향하게, 체력에 따라 너비/색상 조정)
        if (monster3D.healthBar && cameraRef.current) {
          const healthPercent = (monster.health / monster.maxHealth);
          const isBoss = monster.type === 'boss';
          const barWidth = isBoss ? 1.6 : 1.4;
          
          // 체력 바 너비 조정 (왼쪽 정렬)
          monster3D.healthBar.foreground.scale.x = healthPercent;
          monster3D.healthBar.foreground.position.x = -barWidth * (1 - healthPercent) / 2;
          
          // 체력에 따른 색상 변화
          const healthColor = healthPercent > 0.6 ? 0x4caf50 : healthPercent > 0.3 ? 0xff9800 : 0xf44336;
          (monster3D.healthBar.foreground.material as THREE.MeshBasicMaterial).color.setHex(healthColor);
          
          // 카메라를 향하게 회전 (항상 앞면을 보이게)
          if (monster3D.mesh instanceof THREE.Group) {
            const worldPos = new THREE.Vector3();
            monster3D.mesh.getWorldPosition(worldPos);
            const cameraPos = cameraRef.current.position;
            const direction = new THREE.Vector3().subVectors(cameraPos, worldPos).normalize();
            
            // 체력 바가 카메라를 향하도록 회전
            const up = new THREE.Vector3(0, 1, 0);
            const lookAtMatrix = new THREE.Matrix4().lookAt(worldPos, cameraPos, up);
            const quaternion = new THREE.Quaternion().setFromRotationMatrix(lookAtMatrix);
            monster3D.healthBar.background.quaternion.copy(quaternion);
            monster3D.healthBar.foreground.quaternion.copy(quaternion);
          }
        }
      });

      // 사라진 몬스터 제거
      monsters3DRef.current.forEach((monster3D, id) => {
        if (!monsters.find((m) => m.id === id)) {
          // 체력 바 제거
          if (monster3D.healthBar) {
            monster3D.healthBar.background.geometry.dispose();
            monster3D.healthBar.foreground.geometry.dispose();
            (monster3D.healthBar.background.material as THREE.Material).dispose();
            (monster3D.healthBar.foreground.material as THREE.Material).dispose();
          }
          sceneRef.current!.remove(monster3D.mesh);
          
          // Group인 경우 children을 순회하여 dispose
          if (monster3D.mesh instanceof THREE.Group) {
            monster3D.mesh.children.forEach((child) => {
              if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                  child.material.forEach(m => m.dispose());
                } else {
                  child.material.dispose();
                }
              }
            });
          } else if (monster3D.mesh instanceof THREE.Mesh) {
            monster3D.mesh.geometry.dispose();
            if (Array.isArray(monster3D.mesh.material)) {
              monster3D.mesh.material.forEach(m => m.dispose());
            } else {
              monster3D.mesh.material.dispose();
            }
          }
          
          monsters3DRef.current.delete(id);
        }
      });

      // 투사체 업데이트
      projectiles.forEach((projectile) => {
        let projectile3D = projectiles3DRef.current.get(projectile.id);
        if (!projectile3D) {
          const projectileGroup = new THREE.Group();
          
          if (projectile.type === 'arrow') {
            // 화살: 원뿔 형태 + 꼬리 깃털
            const shaft = new THREE.Mesh(
              new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8),
              new THREE.MeshStandardMaterial({ color: 0x8b4513 })
            );
            shaft.rotation.z = Math.PI / 2;
            projectileGroup.add(shaft);
            
            const head = new THREE.Mesh(
              new THREE.ConeGeometry(0.08, 0.15, 8),
              new THREE.MeshStandardMaterial({ color: 0x696969, metalness: 0.9, roughness: 0.1 })
            );
            head.rotation.z = Math.PI / 2;
            head.position.x = 0.3;
            projectileGroup.add(head);
            
            // 꼬리 깃털
            const feather = new THREE.Mesh(
              new THREE.ConeGeometry(0.05, 0.1, 8),
              new THREE.MeshStandardMaterial({ color: 0xffd700 })
            );
            feather.rotation.z = -Math.PI / 2;
            feather.position.x = -0.3;
            projectileGroup.add(feather);
          } else if (projectile.type === 'magic') {
            // 마법구: 빛나는 구체 + 빛나는 파티클
            const core = new THREE.Mesh(
              new THREE.SphereGeometry(0.15, 16, 16),
              new THREE.MeshStandardMaterial({ 
                color: 0x9c27b0, 
                emissive: 0xff00ff, 
                emissiveIntensity: 1.0,
                metalness: 1.0,
                roughness: 0.1
              })
            );
            projectileGroup.add(core);
            
            // 외부 후광
            const aura = new THREE.Mesh(
              new THREE.SphereGeometry(0.25, 16, 16),
              new THREE.MeshStandardMaterial({ 
                color: 0x9c27b0, 
                emissive: 0xff00ff, 
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.3
              })
            );
            projectileGroup.add(aura);
            
            // 작은 파티클들
            for (let i = 0; i < 4; i++) {
              const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.03, 8, 8),
                new THREE.MeshStandardMaterial({ 
                  color: 0xff00ff, 
                  emissive: 0xff00ff, 
                  emissiveIntensity: 1.0
                })
              );
              const angle = (i / 4) * Math.PI * 2;
              particle.position.set(
                Math.cos(angle) * 0.3,
                Math.sin(angle) * 0.3,
                0
              );
              projectileGroup.add(particle);
            }
          } else if (projectile.type === 'dagger') {
            // 단검: 날카로운 칼날
            const blade = new THREE.Mesh(
              new THREE.BoxGeometry(0.05, 0.4, 0.02),
              new THREE.MeshStandardMaterial({ 
                color: 0xc0c0c0, 
                metalness: 1.0, 
                roughness: 0.1,
                emissive: 0xffffff,
                emissiveIntensity: 0.3
              })
            );
            blade.position.y = 0.2;
            projectileGroup.add(blade);
            
            const handle = new THREE.Mesh(
              new THREE.CylinderGeometry(0.03, 0.03, 0.15, 8),
              new THREE.MeshStandardMaterial({ color: 0x654321 })
            );
            handle.position.y = -0.075;
            projectileGroup.add(handle);
          }
          
          projectileGroup.userData.isProjectile = true; // 투사체 식별자 추가
          projectileGroup.userData.projectileId = projectile.id; // 투사체 ID 추가
          sceneRef.current!.add(projectileGroup);
          projectile3D = { id: projectile.id, mesh: projectileGroup as any };
          projectiles3DRef.current.set(projectile.id, projectile3D);
        }
        
        // 2D 화면 좌표를 3D 좌표로 변환
        const x = (projectile.position.x - GAME_WIDTH / 2) / 50;
        const z = -(projectile.position.y - GAME_HEIGHT / 2) / 50;
        projectile3D.mesh.position.set(x, 0.8, z);
        
        // 투사체 타입별 회전
        if (projectile.type === 'arrow') {
          projectile3D.mesh.rotation.y += 0.2;
        } else if (projectile.type === 'magic') {
          projectile3D.mesh.rotation.x += 0.15;
          projectile3D.mesh.rotation.y += 0.15;
          projectile3D.mesh.rotation.z += 0.15;
        } else if (projectile.type === 'dagger') {
          projectile3D.mesh.rotation.x += 0.3;
          projectile3D.mesh.rotation.y += 0.1;
        }
      });

      // 사라진 투사체 제거
      projectiles3DRef.current.forEach((projectile3D, id) => {
        if (!projectiles.find((p) => p.id === id)) {
          sceneRef.current!.remove(projectile3D.mesh);
          
          // Group인 경우 children을 순회하여 dispose
          if (projectile3D.mesh instanceof THREE.Group) {
            projectile3D.mesh.children.forEach((child) => {
              if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                  child.material.forEach(m => m.dispose());
                } else {
                  child.material.dispose();
                }
              }
            });
          } else if (projectile3D.mesh instanceof THREE.Mesh) {
            projectile3D.mesh.geometry.dispose();
            if (Array.isArray(projectile3D.mesh.material)) {
              projectile3D.mesh.material.forEach(m => m.dispose());
            } else {
              projectile3D.mesh.material.dispose();
            }
          }
          
          projectiles3DRef.current.delete(id);
        }
      });

      // 프러스텀 컬링 활성화로 성능 향상
      cameraRef.current.updateMatrixWorld();
      
      if (rendererRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
      if (Platform.OS !== 'web' && glRef.current) {
        glRef.current.endFrameEXP();
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // 애니메이션 시작
    timeRef.current = 0;
    animate();
  };

  useEffect(() => {
    // canvas의 pointerEvents 업데이트 - 항상 auto로 설정하여 카메라 컨트롤 활성화
    // selectedUnitType이 있어도 우클릭/Alt+클릭으로 카메라 조작 가능하도록
    if (Platform.OS === 'web' && canvasRef.current) {
      canvasRef.current.style.pointerEvents = 'auto';
    }
  }, [selectedUnitType]);

  useEffect(() => {
    if (Platform.OS === 'web' && (phase === 'playing' || phase === 'paused')) {
      // 웹에서는 DOM이 준비된 후 초기화
      const timer = setTimeout(() => {
        if (!rendererRef.current && !sceneRef.current) {
          try {
            initializeThreeJS();
          } catch (error) {
            console.error('3D 초기화 실패:', error);
          }
        }
      }, 200);
      
      return () => {
        clearTimeout(timer);
      };
    }
    
    return () => {
      // 정리
      if (canvasRef.current && canvasRef.current.parentNode) {
        try {
          canvasRef.current.parentNode.removeChild(canvasRef.current);
        } catch (e) {
          // 이미 제거됨
        }
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      if (sceneRef.current) {
        // 씬 정리
        while(sceneRef.current.children.length > 0) {
          const child = sceneRef.current.children[0];
          sceneRef.current.remove(child);
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
        sceneRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [phase]);

  useEffect(() => {
    return () => {
      isAnimatingRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // 카메라 컨트롤 이벤트 리스너 정리
      if (Platform.OS === 'web' && canvasRef.current && (canvasRef.current as any)._cleanupCameraControls) {
        (canvasRef.current as any)._cleanupCameraControls();
      }
    };
  }, []);

  // preparing 상태일 때 모든 3D 객체 정리 및 애니메이션 중지
  useEffect(() => {
    if (phase === 'preparing') {
      // 즉시 Renderer를 검은색으로 변경하고 마지막 프레임 렌더링
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.setClearColor(0x000000, 1); // 완전히 검은색
        rendererRef.current.clear();
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
      // Canvas를 즉시 숨김
      if (Platform.OS === 'web' && canvasRef.current) {
        canvasRef.current.style.setProperty('display', 'none', 'important');
        canvasRef.current.style.setProperty('visibility', 'hidden', 'important');
        canvasRef.current.style.setProperty('opacity', '0', 'important');
        canvasRef.current.style.setProperty('z-index', '-99999', 'important');
        canvasRef.current.style.setProperty('pointer-events', 'none', 'important');
      }
      
      // 즉시 강제로 모든 3D 객체 제거 (여러 번 확인)
      const cleanupObjects = () => {
        if (!sceneRef.current) {
          return;
        }
        
        
        // 모든 유닛 제거
        const unitsToRemove = Array.from(units3DRef.current.values());
        unitsToRemove.forEach((unit3D) => {
        if (unit3D.attackEffect && sceneRef.current) {
          sceneRef.current.remove(unit3D.attackEffect);
          unit3D.attackEffect.geometry?.dispose();
          if (Array.isArray(unit3D.attackEffect.material)) {
            unit3D.attackEffect.material.forEach(m => m.dispose());
          } else {
            unit3D.attackEffect.material?.dispose();
          }
        }
        if (unit3D.mesh && sceneRef.current) {
          sceneRef.current.remove(unit3D.mesh);
          if (unit3D.mesh instanceof THREE.Group) {
            unit3D.mesh.children.forEach((child) => {
              if (child instanceof THREE.Mesh) {
                child.geometry?.dispose();
                if (Array.isArray(child.material)) {
                  child.material.forEach(m => m.dispose());
                } else {
                  child.material?.dispose();
                }
              }
            });
          }
        }
      });
      units3DRef.current.clear();
      
      // 모든 몬스터 제거
      monsters3DRef.current.forEach((monster3D) => {
        if (monster3D.healthBar) {
          if (sceneRef.current) {
            sceneRef.current.remove(monster3D.healthBar.background);
            sceneRef.current.remove(monster3D.healthBar.foreground);
          }
          monster3D.healthBar.background.geometry?.dispose();
          monster3D.healthBar.foreground.geometry?.dispose();
          (monster3D.healthBar.background.material as THREE.Material)?.dispose();
          (monster3D.healthBar.foreground.material as THREE.Material)?.dispose();
        }
        if (monster3D.mesh && sceneRef.current) {
          sceneRef.current.remove(monster3D.mesh);
          if (monster3D.mesh instanceof THREE.Group) {
            monster3D.mesh.children.forEach((child) => {
              if (child instanceof THREE.Mesh) {
                child.geometry?.dispose();
                if (Array.isArray(child.material)) {
                  child.material.forEach(m => m.dispose());
                } else {
                  child.material?.dispose();
                }
              }
            });
          }
        }
      });
      monsters3DRef.current.clear();
      
      // 모든 투사체 제거
      projectiles3DRef.current.forEach((projectile3D) => {
        if (projectile3D.mesh && sceneRef.current) {
          sceneRef.current.remove(projectile3D.mesh);
          if (projectile3D.mesh instanceof THREE.Group) {
            projectile3D.mesh.children.forEach((child) => {
              if (child instanceof THREE.Mesh) {
                child.geometry?.dispose();
                if (Array.isArray(child.material)) {
                  child.material.forEach(m => m.dispose());
                } else {
                  child.material?.dispose();
                }
              }
            });
          }
        }
      });
      projectiles3DRef.current.clear();
        
        // 씬에서 모든 게임 객체 강제 제거 (유닛, 몬스터, 투사체)
        if (sceneRef.current) {
          const toRemove: THREE.Object3D[] = [];
          sceneRef.current.traverse((obj) => {
            // 맵 타일, 조명, 성이 아닌 모든 객체 제거
            if (obj !== sceneRef.current && 
                obj.type !== 'AmbientLight' && 
                obj.type !== 'DirectionalLight' && 
                obj.type !== 'PointLight' &&
                !obj.userData.isMapTile &&
                !obj.userData.isCastle &&
                !obj.userData.isPath) {
              toRemove.push(obj);
            }
          });
          toRemove.forEach((obj) => {
            try {
              sceneRef.current?.remove(obj);
              if (obj instanceof THREE.Mesh) {
                obj.geometry?.dispose();
                if (Array.isArray(obj.material)) {
                  obj.material.forEach(m => m.dispose());
                } else if (obj.material) {
                  obj.material.dispose();
                }
              } else if (obj instanceof THREE.Group) {
                obj.children.forEach((child) => {
                  if (child instanceof THREE.Mesh) {
                    child.geometry?.dispose();
                    if (Array.isArray(child.material)) {
                      child.material.forEach(m => m.dispose());
                    } else if (child.material) {
                      child.material.dispose();
                    }
                  }
                });
              }
            } catch (e) {
              // 이미 제거된 경우 무시
            }
          });
        }
        
        // 렌더러를 검은색으로 채우고 강제 업데이트 (화면 지우기)
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.setClearColor(0x000000, 1); // 검은색으로 변경
          rendererRef.current.clear();
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      };
      
      // 즉시 여러 번 실행하여 확실히 제거 (유닛 초기화 강제 실행)
      cleanupObjects();
      setTimeout(() => cleanupObjects(), 0);
      setTimeout(() => cleanupObjects(), 10);
      setTimeout(() => cleanupObjects(), 50);
      setTimeout(() => cleanupObjects(), 100);
      setTimeout(() => cleanupObjects(), 200);
      setTimeout(() => cleanupObjects(), 500);
      setTimeout(() => cleanupObjects(), 1000);
      
      // 애니메이션은 계속 실행 (맵은 계속 렌더링)
      // animate 함수 내에서 preparing 상태일 때 객체만 제거하고 렌더링 계속
      
    }
  }, [phase]);
  
  // preparing 상태에서 canvas 완전히 숨기기
  useEffect(() => {
    if (Platform.OS === 'web' && canvasRef.current) {
      if (phase === 'preparing') {
        // canvas를 완전히 숨김
        canvasRef.current.style.display = 'none';
        canvasRef.current.style.visibility = 'hidden';
        canvasRef.current.style.opacity = '0';
        canvasRef.current.style.pointerEvents = 'none';
        // DOM에서 제거
        if (canvasRef.current.parentNode) {
          const parent = canvasRef.current.parentNode;
          parent.removeChild(canvasRef.current);
          // 나중을 위해 parent에 저장
          (canvasRef.current as any)._savedParent = parent;
        }
      } else {
        // canvas 다시 추가
        const savedParent = (canvasRef.current as any)?._savedParent;
        if (!canvasRef.current.parentNode && savedParent) {
          savedParent.appendChild(canvasRef.current);
        } else if (!canvasRef.current.parentNode && typeof document !== 'undefined') {
          const containerElement = document.querySelector('[data-game-container]') as HTMLElement;
          const target = containerElement || document.body;
          if (target) {
            target.appendChild(canvasRef.current);
          }
        }
        canvasRef.current.style.display = '';
        canvasRef.current.style.visibility = '';
        canvasRef.current.style.opacity = '1';
        canvasRef.current.style.pointerEvents = 'auto';
      }
    }
  }, [phase]);

  // preparing 상태에서도 컴포넌트는 유지하되 렌더링만 중지
  // (다시 playing 상태로 돌아올 때 초기화를 방지하기 위해)

  if (Platform.OS === 'web') {
    // 웹에서는 빈 View만 렌더링 (canvas는 body에 직접 추가됨)
    return (
      <View 
        ref={containerRef}
        style={[styles.container, styles.webContainer]}
      />
    );
  }

  return (
    <View style={styles.container}>
      <GLView style={styles.glView} onContextCreate={onGLContextCreate} />
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
    backgroundColor: '#1a1a1a',
  },
  webContainer: {
    zIndex: 0,
    pointerEvents: 'none' as any,
  },
  glView: {
    flex: 1,
  },
});
