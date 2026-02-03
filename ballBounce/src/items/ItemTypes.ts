import { ItemType } from '../types/game.types';

export interface ItemConfig {
  type: ItemType;
  name: string;
  color: string;
  duration: number; // 효과 지속 시간 (ms)
  description: string;
}

export const ITEM_CONFIGS: Record<ItemType, ItemConfig> = {
  [ItemType.BIG_BALL]: {
    type: ItemType.BIG_BALL,
    name: '큰 공',
    color: '#FFD700',
    duration: 10000, // 10초
    description: '공이 커져서 벽돌 맞추기 쉬워집니다',
  },
  [ItemType.MULTI_BALL]: {
    type: ItemType.MULTI_BALL,
    name: '다중 공',
    color: '#00FF00',
    duration: 0, // 즉시 효과
    description: '공이 2개로 분열됩니다',
  },
  [ItemType.SLOW_BALL]: {
    type: ItemType.SLOW_BALL,
    name: '느린 공',
    color: '#4169E1',
    duration: 8000,
    description: '공 속도가 느려집니다',
  },
  [ItemType.FAST_BALL]: {
    type: ItemType.FAST_BALL,
    name: '빠른 공',
    color: '#FF4500',
    duration: 8000,
    description: '공 속도가 빨라집니다',
  },
  [ItemType.LONG_PADDLE]: {
    type: ItemType.LONG_PADDLE,
    name: '긴 패들',
    color: '#32CD32',
    duration: 12000,
    description: '패들이 길어집니다',
  },
  [ItemType.SHORT_PADDLE]: {
    type: ItemType.SHORT_PADDLE,
    name: '짧은 패들',
    color: '#FF6347',
    duration: 8000,
    description: '패들이 짧아집니다 (난이도 증가)',
  },
  [ItemType.LASER]: {
    type: ItemType.LASER,
    name: '레이저',
    color: '#FF00FF',
    duration: 10000,
    description: '패들에서 레이저를 발사합니다',
  },
  [ItemType.MAGNETIC]: {
    type: ItemType.MAGNETIC,
    name: '자석',
    color: '#9370DB',
    duration: 5000,
    description: '공이 패들에 달라붙습니다',
  },
};

export const ITEM_COLORS: Record<ItemType, string> = {
  [ItemType.BIG_BALL]: '#FFD700',
  [ItemType.MULTI_BALL]: '#00FF00',
  [ItemType.SLOW_BALL]: '#4169E1',
  [ItemType.FAST_BALL]: '#FF4500',
  [ItemType.LONG_PADDLE]: '#32CD32',
  [ItemType.SHORT_PADDLE]: '#FF6347',
  [ItemType.LASER]: '#FF00FF',
  [ItemType.MAGNETIC]: '#9370DB',
};

