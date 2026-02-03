import type { Brick, GameConfig } from '../types/game.types';
import { PatternGenerator } from '../patterns/PatternGenerator';

export class RoundManager {
  private currentRound: number = 1;

  /**
   * 현재 라운드 반환
   */
  getRound(): number {
    return this.currentRound;
  }

  /**
   * 다음 라운드로 진행
   */
  nextRound(): void {
    this.currentRound++;
  }

  /**
   * 벽돌이 모두 깨졌는지 확인
   */
  isRoundComplete(bricks: Brick[]): boolean {
    return bricks.every((brick) => brick.health <= 0);
  }

  /**
   * 새 라운드 벽돌 생성
   */
  generateNewRound(config: GameConfig): Brick[] {
    return PatternGenerator.generatePattern(config, this.currentRound);
  }

  /**
   * 라운드 초기화
   */
  reset(): void {
    this.currentRound = 1;
  }
}

