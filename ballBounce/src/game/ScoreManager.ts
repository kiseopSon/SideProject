import type { Brick } from '../types/game.types';

export class ScoreManager {
  private score: number = 0;
  private round: number = 1;

  /**
   * 벽돌 깨기 점수 계산
   */
  addBrickScore(brick: Brick, round: number): number {
    const baseScore = brick.points;
    const roundMultiplier = 1 + (round - 1) * 0.1; // 라운드당 10% 보너스
    const score = Math.floor(baseScore * roundMultiplier);
    this.score += score;
    return score;
  }

  /**
   * 라운드 클리어 보너스
   */
  addRoundBonus(round: number): number {
    const bonus = round * 100;
    this.score += bonus;
    return bonus;
  }

  /**
   * 점수 반환
   */
  getScore(): number {
    return this.score;
  }

  /**
   * 라운드 반환
   */
  getRound(): number {
    return this.round;
  }

  /**
   * 라운드 증가
   */
  nextRound(): void {
    this.round++;
  }

  /**
   * 점수 초기화
   */
  reset(): void {
    this.score = 0;
    this.round = 1;
  }
}

