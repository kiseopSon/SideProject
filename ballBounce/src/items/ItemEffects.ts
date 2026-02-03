import type { Ball, Paddle, GameConfig } from '../types/game.types';
import { ItemType } from '../types/game.types';
import { Physics } from '../game/Physics';

export class ItemEffectManager {
  private originalBallRadius: number = 0;
  private originalBallSpeed: number = 0;
  private originalPaddleWidth: number = 0;
  private activeEffects: Set<ItemType> = new Set();

  /**
   * 아이템 효과 적용
   */
  applyEffect(
    type: ItemType,
    ball: Ball,
    paddle: Paddle,
    config: GameConfig,
    balls: Ball[]
  ): void {
    switch (type) {
      case ItemType.BIG_BALL:
        this.applyBigBall(ball, config);
        break;
      case ItemType.MULTI_BALL:
        this.applyMultiBall(ball, balls);
        break;
      case ItemType.SLOW_BALL:
        this.applySlowBall(ball, config);
        break;
      case ItemType.FAST_BALL:
        this.applyFastBall(ball, config);
        break;
      case ItemType.LONG_PADDLE:
        this.applyLongPaddle(paddle, config);
        break;
      case ItemType.SHORT_PADDLE:
        this.applyShortPaddle(paddle, config);
        break;
      case ItemType.MAGNETIC:
        // 자석 효과는 게임 루프에서 처리
        this.activeEffects.add(ItemType.MAGNETIC);
        break;
      case ItemType.LASER:
        // 레이저 효과는 게임 루프에서 처리
        this.activeEffects.add(ItemType.LASER);
        break;
    }
  }

  /**
   * 효과 제거
   */
  removeEffect(
    type: ItemType,
    ball: Ball,
    paddle: Paddle,
    config: GameConfig
  ): void {
    switch (type) {
      case ItemType.BIG_BALL:
        ball.radius = config.ballRadius;
        break;
      case ItemType.SLOW_BALL:
      case ItemType.FAST_BALL:
        ball.speed = config.ballSpeed;
        ball.velocity = Physics.normalizeVelocity(ball.velocity, ball.speed);
        break;
      case ItemType.LONG_PADDLE:
      case ItemType.SHORT_PADDLE:
        paddle.width = config.paddleWidth;
        break;
      case ItemType.MAGNETIC:
      case ItemType.LASER:
        this.activeEffects.delete(type);
        break;
    }
  }

  private applyBigBall(ball: Ball, config: GameConfig): void {
    if (this.originalBallRadius === 0) {
      this.originalBallRadius = ball.radius;
    }
    ball.radius = config.ballRadius * 1.5;
  }

  private applyMultiBall(ball: Ball, balls: Ball[]): void {
    // 기존 공 복제 (최대 3개까지만)
    if (balls.length < 3) {
      const newBall: Ball = {
        position: { ...ball.position },
        velocity: {
          x: -ball.velocity.x,
          y: ball.velocity.y,
        },
        radius: ball.radius,
        speed: ball.speed,
        color: ball.color,
      };
      balls.push(newBall);
    }
  }

  private applySlowBall(ball: Ball, config: GameConfig): void {
    if (this.originalBallSpeed === 0) {
      this.originalBallSpeed = ball.speed;
    }
    ball.speed = config.ballSpeed * 0.6;
    ball.velocity = Physics.normalizeVelocity(ball.velocity, ball.speed);
  }

  private applyFastBall(ball: Ball, config: GameConfig): void {
    if (this.originalBallSpeed === 0) {
      this.originalBallSpeed = ball.speed;
    }
    ball.speed = config.ballSpeed * 1.5;
    ball.velocity = Physics.normalizeVelocity(ball.velocity, ball.speed);
  }

  private applyLongPaddle(paddle: Paddle, config: GameConfig): void {
    if (this.originalPaddleWidth === 0) {
      this.originalPaddleWidth = paddle.width;
    }
    paddle.width = config.paddleWidth * 1.5;
  }

  private applyShortPaddle(paddle: Paddle, config: GameConfig): void {
    if (this.originalPaddleWidth === 0) {
      this.originalPaddleWidth = paddle.width;
    }
    paddle.width = config.paddleWidth * 0.7;
  }

  /**
   * 자석 효과 적용 (공이 패들에 달라붙음)
   */
  applyMagneticEffect(ball: Ball, paddle: Paddle): void {
    if (!this.activeEffects.has(ItemType.MAGNETIC)) return;

    const paddleCenterX = paddle.position.x + paddle.width / 2;
    const distanceX = paddleCenterX - ball.position.x;
    
    // 공을 패들 중앙으로 부드럽게 이동
    ball.position.x += distanceX * 0.1;
    ball.velocity.x = 0;
    ball.velocity.y = 0;
  }

  /**
   * 자석 효과 해제 (스페이스바로 발사)
   */
  releaseMagneticBall(ball: Ball): void {
    if (!this.activeEffects.has(ItemType.MAGNETIC)) return;
    
    ball.velocity = {
      x: (Math.random() - 0.5) * ball.speed * 0.5,
      y: -ball.speed,
    };
    ball.velocity = Physics.normalizeVelocity(ball.velocity, ball.speed);
  }

  /**
   * 레이저 발사 여부 확인
   */
  hasLaser(): boolean {
    return this.activeEffects.has(ItemType.LASER);
  }

  /**
   * 자석 효과 활성 여부 확인
   */
  hasMagnetic(): boolean {
    return this.activeEffects.has(ItemType.MAGNETIC);
  }

  /**
   * 모든 효과 초기화
   */
  reset(): void {
    this.originalBallRadius = 0;
    this.originalBallSpeed = 0;
    this.originalPaddleWidth = 0;
    this.activeEffects.clear();
  }
}

