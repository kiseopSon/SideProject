import { MonsterType } from '../types/game';

export interface MonsterConfig {
  name: string;
  emoji: string;
  baseHealth: number;
  speed: number;
  goldReward: number;
}

export const MONSTER_CONFIGS: Record<MonsterType, MonsterConfig> = {
  normal: {
    name: '일반 몬스터',
    emoji: '👾',
    baseHealth: 100,
    speed: 1.5,
    goldReward: 10,
  },
  fast: {
    name: '빠른 몬스터',
    emoji: '💨',
    baseHealth: 60,
    speed: 3.0,
    goldReward: 15,
  },
  tank: {
    name: '탱커 몬스터',
    emoji: '🦏',
    baseHealth: 300,
    speed: 0.8,
    goldReward: 25,
  },
  boss: {
    name: '보스',
    emoji: '🐉',
    baseHealth: 1000,
    speed: 1.0,
    goldReward: 100,
  },
};

export function generateWaveMonsters(wave: number): { type: MonsterType; count: number }[] {
  const monsters: { type: MonsterType; count: number }[] = [];
  
  // 웨이브에 따라 몬스터 조합 생성
  const baseNormal = Math.floor(5 + wave * 2);
  const fastCount = Math.floor(wave / 3);
  const tankCount = Math.floor(wave / 5);
  
  monsters.push({ type: 'normal', count: baseNormal });
  if (fastCount > 0) {
    monsters.push({ type: 'fast', count: fastCount });
  }
  if (tankCount > 0) {
    monsters.push({ type: 'tank', count: tankCount });
  }
  if (wave % 5 === 0 && wave > 0) {
    monsters.push({ type: 'boss', count: 1 });
  }
  
  return monsters;
}

export function getMonsterHealth(type: MonsterType, wave: number): number {
  const config = MONSTER_CONFIGS[type];
  // 임시: 4라운드 테스트용으로 체력 증가율을 낮춤
  const effectiveWave = wave > 4 ? wave : 1; // 4라운드까지는 1라운드 체력으로
  const multiplier = 1 + (effectiveWave - 1) * 0.3; // 웨이브마다 30% 증가
  return Math.floor(config.baseHealth * multiplier);
}
