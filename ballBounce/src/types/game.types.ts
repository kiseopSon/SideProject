// 게임 기본 타입 정의

export interface Vector2D {
  x: number;
  y: number;
}

export interface GameObject {
  position: Vector2D;
  width: number;
  height: number;
}

export interface Ball {
  position: Vector2D;
  velocity: Vector2D;
  radius: number;
  speed: number;
  color: string;
}

export interface Laser {
  position: Vector2D;
  width: number;
  height: number;
}

export interface Paddle extends GameObject {
  color: string;
  speed: number;
}

export interface Brick extends GameObject {
  color: string;
  points: number;
  health: number;
  maxHealth: number;
  canDropItem: boolean;
}

export interface Item extends GameObject {
  type: ItemType;
  velocity: Vector2D;
  color: string;
}

export type ItemType =
  | 'BIG_BALL'
  | 'MULTI_BALL'
  | 'SLOW_BALL'
  | 'FAST_BALL'
  | 'LONG_PADDLE'
  | 'SHORT_PADDLE'
  | 'LASER'
  | 'MAGNETIC';

export const ItemType = {
  BIG_BALL: 'BIG_BALL' as const,
  MULTI_BALL: 'MULTI_BALL' as const,
  SLOW_BALL: 'SLOW_BALL' as const,
  FAST_BALL: 'FAST_BALL' as const,
  LONG_PADDLE: 'LONG_PADDLE' as const,
  SHORT_PADDLE: 'SHORT_PADDLE' as const,
  LASER: 'LASER' as const,
  MAGNETIC: 'MAGNETIC' as const,
};

export interface ItemEffect {
  type: ItemType;
  duration: number;
  startTime: number;
  isActive: boolean;
}

export interface GameState {
  score: number;
  round: number;
  lives: number;
  isPaused: boolean;
  isGameOver: boolean;
  activeEffects: ItemEffect[];
}

export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  paddleWidth: number;
  paddleHeight: number;
  paddleSpeed: number;
  ballRadius: number;
  ballSpeed: number;
  brickRows: number;
  brickCols: number;
  brickWidth: number;
  brickHeight: number;
  brickPadding: number;
  itemDropChance: number; // 0-1 사이의 확률
}

