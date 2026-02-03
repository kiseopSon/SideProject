import { Position } from '../types/game';

// 미로 같은 경로 포인트 정의 (상대 좌표 0-1 범위로 정의)
// 실제 좌표는 화면 크기에 맞게 계산됨
let RELATIVE_PATH_POINTS: Array<{ x: number; y: number }> = [
  { x: 0, y: 0.35 },       // 시작 (왼쪽 위)
  { x: 0.15, y: 0.35 },    // 오른쪽으로
  { x: 0.15, y: 0.25 },    // 위로
  { x: 0.35, y: 0.25 },    // 오른쪽으로
  { x: 0.35, y: 0.45 },    // 아래로
  { x: 0.55, y: 0.45 },    // 오른쪽으로
  { x: 0.55, y: 0.15 },    // 위로
  { x: 0.4, y: 0.15 },     // 왼쪽으로
  { x: 0.4, y: 0.55 },     // 아래로
  { x: 0.7, y: 0.55 },     // 오른쪽으로
  { x: 0.7, y: 0.35 },     // 위로
  { x: 0.85, y: 0.35 },    // 오른쪽으로
  { x: 0.85, y: 0.65 },    // 아래로
  { x: 1.0, y: 0.65 },     // 오른쪽으로 (성 도착)
];

let screenWidth = 400;
let screenHeight = 800;
let cachedPathPoints: Position[] = [];
let currentWave = 1; // 현재 웨이브 추적
let mapVariation = 0; // 맵 변형 번호

// 웨이브에 따라 난이도 조정 (경로를 더 복잡하게)
export function setWave(wave: number) {
  currentWave = wave;
}

// 화면 크기 설정 및 경로 포인트 캐시
export function setScreenSize(width: number, height: number) {
  screenWidth = width;
  screenHeight = height;
  
  // 웨이브가 높아질수록 경로를 더 복잡하게 (포인트 추가)
  let pathPoints = [...RELATIVE_PATH_POINTS];
  
  // 웨이브 5마다 경로 포인트 하나씩 추가 (더 복잡한 경로)
  const extraPoints = Math.floor((currentWave - 1) / 5);
  if (extraPoints > 0) {
    // 기존 경로에 추가 포인트 삽입하여 더 복잡하게
    for (let i = 0; i < extraPoints && i < 3; i++) {
      const insertIndex = Math.floor(pathPoints.length / 2) + i * 2;
      if (insertIndex < pathPoints.length - 1) {
        const prev = pathPoints[insertIndex];
        const next = pathPoints[insertIndex + 1];
        const newPoint = {
          x: (prev.x + next.x) / 2 + (Math.random() - 0.5) * 0.1,
          y: (prev.y + next.y) / 2 + (Math.random() - 0.5) * 0.1,
        };
        pathPoints.splice(insertIndex + 1, 0, newPoint);
      }
    }
  }
  
  // 실제 좌표로 변환
  cachedPathPoints = pathPoints.map(point => ({
    x: point.x * width,
    y: point.y * height,
  }));
}

// 경로 포인트 가져오기
export function getPathPoints(): Position[] {
  if (cachedPathPoints.length === 0) {
    // 기본값으로 초기화
    setScreenSize(400, 800);
  }
  return cachedPathPoints;
}

const PATH_POINTS = getPathPoints();

// 경로 길이 계산
export function getPathLength(): number {
  const points = getPathPoints();
  let totalLength = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    totalLength += Math.sqrt(dx * dx + dy * dy);
  }
  return totalLength;
}

// 진행도(0-1)를 기반으로 경로상의 위치 계산
export function getPositionOnPath(progress: number): Position {
  const points = getPathPoints();
  if (progress <= 0) return points[0];
  if (progress >= 1) return points[points.length - 1];

  const totalLength = getPathLength();
  const targetDistance = progress * totalLength;

  let currentDistance = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const segmentLength = Math.sqrt(dx * dx + dy * dy);

    if (currentDistance + segmentLength >= targetDistance) {
      // 이 세그먼트 내에 있음
      const segmentProgress = (targetDistance - currentDistance) / segmentLength;
      return {
        x: prev.x + dx * segmentProgress,
        y: prev.y + dy * segmentProgress,
      };
    }

    currentDistance += segmentLength;
  }

  return points[points.length - 1];
}

// 특정 위치가 경로 근처인지 확인 (유닛 배치 제한용)
export function isNearPath(position: Position, threshold: number = 40): boolean {
  const points = getPathPoints();
  // 경로 근처에는 유닛을 배치할 수 없음
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    
    // 선분과 점 사이의 최단 거리 계산
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) continue;
    
    const t = Math.max(0, Math.min(1, 
      ((position.x - prev.x) * dx + (position.y - prev.y) * dy) / (length * length)
    ));
    
    const projX = prev.x + t * dx;
    const projY = prev.y + t * dy;
    
    const distX = position.x - projX;
    const distY = position.y - projY;
    const distance = Math.sqrt(distX * distX + distY * distY);
    
    if (distance <= threshold) {
      return true;
    }
  }
  
  return false;
}

// 완전히 새로운 맵 생성 (5웨이브 보스 처치 후)
export function generateNewMap() {
  mapVariation = (mapVariation + 1) % 4; // 4가지 맵 변형 순환
  
  // 완전히 다른 경로 생성
  const variations: Array<Array<{ x: number; y: number }>> = [
    // 변형 1: 원래 맵
    [
      { x: 0, y: 0.35 },
      { x: 0.15, y: 0.35 },
      { x: 0.15, y: 0.25 },
      { x: 0.35, y: 0.25 },
      { x: 0.35, y: 0.45 },
      { x: 0.55, y: 0.45 },
      { x: 0.55, y: 0.15 },
      { x: 0.4, y: 0.15 },
      { x: 0.4, y: 0.55 },
      { x: 0.7, y: 0.55 },
      { x: 0.7, y: 0.35 },
      { x: 0.85, y: 0.35 },
      { x: 0.85, y: 0.65 },
      { x: 1.0, y: 0.65 },
    ],
    // 변형 2: 다른 경로
    [
      { x: 0, y: 0.2 },
      { x: 0.25, y: 0.2 },
      { x: 0.25, y: 0.5 },
      { x: 0.1, y: 0.5 },
      { x: 0.1, y: 0.7 },
      { x: 0.5, y: 0.7 },
      { x: 0.5, y: 0.3 },
      { x: 0.7, y: 0.3 },
      { x: 0.7, y: 0.6 },
      { x: 0.9, y: 0.6 },
      { x: 0.9, y: 0.4 },
      { x: 1.0, y: 0.4 },
    ],
    // 변형 3: 다른 경로
    [
      { x: 0, y: 0.5 },
      { x: 0.3, y: 0.5 },
      { x: 0.3, y: 0.2 },
      { x: 0.6, y: 0.2 },
      { x: 0.6, y: 0.7 },
      { x: 0.2, y: 0.7 },
      { x: 0.2, y: 0.4 },
      { x: 0.8, y: 0.4 },
      { x: 0.8, y: 0.6 },
      { x: 1.0, y: 0.6 },
    ],
    // 변형 4: 다른 경로
    [
      { x: 0, y: 0.3 },
      { x: 0.4, y: 0.3 },
      { x: 0.4, y: 0.1 },
      { x: 0.6, y: 0.1 },
      { x: 0.6, y: 0.5 },
      { x: 0.2, y: 0.5 },
      { x: 0.2, y: 0.7 },
      { x: 0.7, y: 0.7 },
      { x: 0.7, y: 0.4 },
      { x: 0.9, y: 0.4 },
      { x: 0.9, y: 0.6 },
      { x: 1.0, y: 0.6 },
    ],
  ];
  
  // 새로운 경로로 설정
  const newPath = variations[mapVariation];
  if (newPath) {
    RELATIVE_PATH_POINTS = newPath;
    // 캐시된 경로 업데이트
    cachedPathPoints = newPath.map(point => ({
      x: point.x * screenWidth,
      y: point.y * screenHeight,
    }));
  }
  
  // 화면 크기 재설정하여 새 경로 적용
  setScreenSize(screenWidth, screenHeight);
}
