import type { Ball, Brick, Paddle, Item } from '../types/game.types';
import { Physics } from './Physics';

export class CollisionDetector {
  /**
   * 공과 모든 벽돌의 충돌 체크
   */
  static checkBallBrickCollisions(ball: Ball, bricks: Brick[]): Brick | null {
    for (const brick of bricks) {
      if (brick.health > 0 && Physics.checkBrickCollision(ball, brick)) {
        return brick;
      }
    }
    return null;
  }

  /**
   * 공과 패들의 충돌 체크
   */
  static checkBallPaddleCollision(ball: Ball, paddle: Paddle): boolean {
    return Physics.checkPaddleCollision(ball, paddle);
  }

  /**
   * 아이템과 패들의 충돌 체크
   */
  static checkItemPaddleCollision(item: Item, paddle: Paddle): boolean {
    return Physics.checkItemCollision(item, paddle);
  }
}

