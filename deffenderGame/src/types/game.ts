// 게임 타입 정의

export type UnitType = 'archer' | 'wizard' | 'tank' | 'healer' | 'assassin';

export type MonsterType = 'normal' | 'fast' | 'tank' | 'boss';

export interface Position {
  x: number;
  y: number;
}

export interface Unit {
  id: string;
  type: UnitType;
  position: Position;
  health: number;
  maxHealth: number;
  damage: number;
  attackRange: number;
  attackSpeed: number; // 공격 간격 (ms)
  lastAttackTime: number;
  cost: number;
  level: number;
}

export interface Monster {
  id: string;
  type: MonsterType;
  position: Position;
  health: number;
  maxHealth: number;
  speed: number; // 픽셀/프레임
  goldReward: number;
  progress: number; // 경로 진행도 (0-1)
}

export interface Projectile {
  id: string;
  fromUnitId: string;
  targetMonsterId: string;
  position: Position;
  targetPosition: Position;
  damage: number;
  speed: number;
  type: 'arrow' | 'magic' | 'dagger';
}

export interface DamageIndicator {
  id: string;
  damage: number;
  position: Position;
  type: 'damage' | 'heal';
  createdAt: number;
}

export interface GameState {
  phase: 'menu' | 'playing' | 'paused' | 'gameover' | 'victory' | 'preparing';
  wave: number;
  gold: number;
  castleHealth: number;
  maxCastleHealth: number;
  units: Unit[];
  monsters: Monster[];
  projectiles: Projectile[];
  selectedUnitType: UnitType | null;
  gameSpeed: number;
  nextMonsterSpawnTime: number;
  monstersToSpawn: Array<{ type: MonsterType; spawnTime: number }>;
  damageIndicators: DamageIndicator[];
  preparationEndTime?: number; // 준비 시간 종료 시각
}

export interface UnitConfig {
  name: string;
  emoji: string;
  description: string;
  baseHealth: number;
  baseDamage: number;
  attackRange: number;
  attackSpeed: number;
  cost: number;
}
