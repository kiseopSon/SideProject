import type { ItemEffect, ItemType } from '../types/game.types';
import { ITEM_CONFIGS } from '../items/ItemTypes';

export class EffectManager {
  private effects: Map<ItemType, ItemEffect> = new Map();

  /**
   * 효과 추가
   */
  addEffect(type: ItemType, currentTime: number): void {
    const config = ITEM_CONFIGS[type];
    
    // 즉시 효과는 저장하지 않음
    if (config.duration === 0) {
      return;
    }

    // 기존 효과가 있으면 시간 갱신
    const existingEffect = this.effects.get(type);
    if (existingEffect) {
      existingEffect.startTime = currentTime;
      existingEffect.isActive = true;
    } else {
      this.effects.set(type, {
        type,
        duration: config.duration,
        startTime: currentTime,
        isActive: true,
      });
    }
  }

  /**
   * 효과 업데이트 (시간 경과에 따른 만료 처리)
   */
  updateEffects(currentTime: number): ItemType[] {
    const expiredEffects: ItemType[] = [];

    this.effects.forEach((effect, type) => {
      if (effect.isActive && currentTime - effect.startTime >= effect.duration) {
        effect.isActive = false;
        expiredEffects.push(type);
      }
    });

    // 만료된 효과 제거
    expiredEffects.forEach((type) => {
      this.effects.delete(type);
    });

    return expiredEffects;
  }

  /**
   * 활성 효과 목록 반환
   */
  getActiveEffects(): ItemEffect[] {
    return Array.from(this.effects.values()).filter((effect) => effect.isActive);
  }

  /**
   * 특정 효과 활성 여부 확인
   */
  isEffectActive(type: ItemType): boolean {
    const effect = this.effects.get(type);
    return effect?.isActive ?? false;
  }

  /**
   * 효과 제거
   */
  removeEffect(type: ItemType): void {
    this.effects.delete(type);
  }

  /**
   * 모든 효과 초기화
   */
  clear(): void {
    this.effects.clear();
  }
}

