import { ItemType } from '../types/game.types';

export class ItemDropManager {
  private static readonly BASE_DROP_CHANCE = 0.3; // 30% 기본 확률
  private static readonly ROUND_BONUS = 0.05; // 라운드당 5% 증가

  /**
   * 벽돌을 깼을 때 아이템을 드롭할지 결정
   */
  static shouldDropItem(round: number): boolean {
    const dropChance = this.BASE_DROP_CHANCE + (round - 1) * this.ROUND_BONUS;
    return Math.random() < Math.min(dropChance, 0.7); // 최대 70%
  }

  /**
   * 랜덤 아이템 타입 선택
   */
  static getRandomItemType(): ItemType {
    const itemTypes = Object.values(ItemType);
    // 특정 아이템은 더 드물게
    const weights: Record<ItemType, number> = {
      [ItemType.BIG_BALL]: 1.0,
      [ItemType.MULTI_BALL]: 0.8,
      [ItemType.SLOW_BALL]: 1.0,
      [ItemType.FAST_BALL]: 0.7,
      [ItemType.LONG_PADDLE]: 1.2,
      [ItemType.SHORT_PADDLE]: 0.3, // 드물게
      [ItemType.LASER]: 0.5,
      [ItemType.MAGNETIC]: 0.6,
    };

    const weightedItems: ItemType[] = [];
    itemTypes.forEach((type) => {
      const weight = weights[type] || 1.0;
      for (let i = 0; i < weight * 10; i++) {
        weightedItems.push(type);
      }
    });

    return weightedItems[Math.floor(Math.random() * weightedItems.length)];
  }

  /**
   * 아이템 드롭 위치 계산
   */
  static getDropPosition(brickX: number, brickY: number, brickWidth: number, brickHeight: number) {
    return {
      x: brickX + brickWidth / 2,
      y: brickY + brickHeight / 2,
    };
  }
}

