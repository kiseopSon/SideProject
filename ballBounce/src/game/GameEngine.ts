import type { Ball, Paddle, Brick, Item, GameState, GameConfig } from '../types/game.types';
import { ItemType } from '../types/game.types';
import { Physics } from './Physics';
import { CollisionDetector } from './Collision';
import { RoundManager } from './RoundManager';
import { ScoreManager } from './ScoreManager';
import { EffectManager } from './EffectManager';
import { ItemEffectManager } from '../items/ItemEffects';
import { ItemDropManager } from '../items/ItemDrop';

export class GameEngine {
  private config: GameConfig;
  private state: GameState;
  private balls: Ball[] = [];
  private paddle: Paddle;
  private bricks: Brick[] = [];
  private items: Item[] = [];
  private lasers: Laser[] = [];
  private roundManager: RoundManager;
  private scoreManager: ScoreManager;
  private effectManager: EffectManager;
  private itemEffectManager: ItemEffectManager;
  private lastTime: number = 0;
  private magneticBall: Ball | null = null;
  private ballLaunched: boolean = false;
  private lastLaserFireTime: number = 0;

  constructor(config: GameConfig) {
    this.config = config;
    this.roundManager = new RoundManager();
    this.scoreManager = new ScoreManager();
    this.effectManager = new EffectManager();
    this.itemEffectManager = new ItemEffectManager();

    // 초기 상태
    this.state = {
      score: 0,
      round: 1,
      lives: 3,
      isPaused: false,
      isGameOver: false,
      activeEffects: [],
    };

    // 패들 초기화
    this.paddle = {
      position: {
        x: config.canvasWidth / 2 - config.paddleWidth / 2,
        y: config.canvasHeight - config.paddleHeight - 20,
      },
      width: config.paddleWidth,
      height: config.paddleHeight,
      color: '#4ECDC4',
      speed: config.paddleSpeed,
    };

    // 공 초기화
    this.resetBall();

    // 벽돌 생성
    this.bricks = this.roundManager.generateNewRound(config);
  }

  /**
   * 공 초기화
   */
  resetBall(): void {
    this.balls = [{
      position: {
        x: this.config.canvasWidth / 2,
        y: this.paddle.position.y - this.config.ballRadius - 5,
      },
      velocity: {
        x: 0,
        y: 0,
      },
      radius: this.config.ballRadius,
      speed: this.config.ballSpeed,
      color: '#FFFFFF',
    }];
    this.magneticBall = null;
    this.ballLaunched = false;
  }

  /**
   * 게임 업데이트
   */
  update(currentTime: number, mouseX: number): void {
    if (this.state.isPaused || this.state.isGameOver) return;

    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // 최대 0.1초
    this.lastTime = currentTime;

    // 패들 위치 업데이트 (마우스 추적)
    this.updatePaddle(mouseX);

    // 효과 업데이트
    const expiredEffects = this.effectManager.updateEffects(currentTime);
    expiredEffects.forEach((type) => {
      this.balls.forEach((ball) => {
        this.itemEffectManager.removeEffect(type, ball, this.paddle, this.config);
      });
    });

    // 자석 효과 처리
    if (this.itemEffectManager.hasMagnetic() && this.magneticBall) {
      this.itemEffectManager.applyMagneticEffect(this.magneticBall, this.paddle);
    }

    // 공 업데이트 (발사된 경우에만)
    if (this.ballLaunched) {
      this.updateBalls(deltaTime);
    } else {
      // 공이 패들 위에 정확히 위치하도록 유지
      this.balls.forEach((ball) => {
        ball.position.x = this.paddle.position.x + this.paddle.width / 2;
        ball.position.y = this.paddle.position.y - ball.radius - 5;
      });
    }

    // 아이템 업데이트
    this.updateItems(deltaTime);

    // 레이저 업데이트 및 발사
    this.updateLasers(deltaTime);
    if (this.itemEffectManager.hasLaser() && currentTime - this.lastLaserFireTime > 500) {
      this.fireLaser();
      this.lastLaserFireTime = currentTime;
    }

    // 충돌 감지
    this.checkCollisions();

    // 라운드 완료 체크
    if (this.roundManager.isRoundComplete(this.bricks)) {
      this.nextRound();
    }

    // 게임 오버 체크
    if (this.balls.length === 0) {
      this.state.lives--;
      if (this.state.lives <= 0) {
        this.state.isGameOver = true;
      } else {
        this.resetBall();
      }
    }

    // 상태 업데이트 (항상 최신 상태로 갱신)
    this.state.score = this.scoreManager.getScore();
    this.state.round = this.roundManager.getRound();
    this.state.activeEffects = [...this.effectManager.getActiveEffects()]; // 새 배열로 복사
  }

  /**
   * 패들 위치 업데이트
   */
  private updatePaddle(mouseX: number): void {
    const targetX = mouseX - this.paddle.width / 2;
    this.paddle.position.x = Math.max(
      0,
      Math.min(targetX, this.config.canvasWidth - this.paddle.width)
    );
  }

  /**
   * 공 업데이트
   */
  private updateBalls(deltaTime: number): void {
    this.balls = this.balls.filter((ball) => {
      // 자석 효과가 없을 때만 물리 업데이트
      if (!this.itemEffectManager.hasMagnetic() || ball !== this.magneticBall) {
        Physics.updateBallPosition(ball, deltaTime);
        Physics.handleWallCollision(ball, this.config.canvasWidth);
      }

      // 화면 밖으로 나갔는지 확인
      if (Physics.isBallOutOfBounds(ball, this.config.canvasHeight)) {
        return false;
      }

      return true;
    });
  }

  /**
   * 아이템 업데이트
   */
  private updateItems(deltaTime: number): void {
    this.items = this.items.filter((item) => {
      item.position.y += item.velocity.y * deltaTime;

      // 화면 밖으로 나갔는지 확인
      if (item.position.y > this.config.canvasHeight) {
        return false;
      }

      // 패들과 충돌 체크
      if (CollisionDetector.checkItemPaddleCollision(item, this.paddle)) {
        this.collectItem(item);
        // 상태 즉시 업데이트 (활성 효과 갱신)
        this.state.activeEffects = [...this.effectManager.getActiveEffects()];
        return false;
      }

      return true;
    });
  }

  /**
   * 충돌 감지
   */
  private checkCollisions(): void {
    this.balls.forEach((ball) => {
      // 패들과 충돌
      if (CollisionDetector.checkBallPaddleCollision(ball, this.paddle)) {
        if (!this.ballLaunched) {
          // 공 발사
          const angle = (Math.random() - 0.5) * Math.PI / 3; // -30도 ~ 30도
          ball.velocity.x = Math.sin(angle) * ball.speed;
          ball.velocity.y = -Math.abs(Math.cos(angle) * ball.speed);
          this.ballLaunched = true;
        } else {
          if (this.itemEffectManager.hasMagnetic() && !this.magneticBall) {
            this.magneticBall = ball;
          }
        }
      }

      // 벽돌과 충돌
      const hitBrick = CollisionDetector.checkBallBrickCollisions(ball, this.bricks);
      if (hitBrick) {
        hitBrick.health--;
        if (hitBrick.health <= 0) {
          // 점수 추가
          this.scoreManager.addBrickScore(hitBrick, this.roundManager.getRound());

          // 아이템 드롭 (canDropItem이 true이거나 확률로 드롭)
          if (hitBrick.canDropItem || ItemDropManager.shouldDropItem(this.roundManager.getRound())) {
            this.dropItem(hitBrick);
          }
        } else {
          // 체력이 남아있으면 색상 업데이트
          hitBrick.color = this.getColorByHealth(hitBrick.health);
        }
      }
    });
  }

  /**
   * 아이템 드롭
   */
  private dropItem(brick: Brick): void {
    const itemType = ItemDropManager.getRandomItemType();
    const dropPos = ItemDropManager.getDropPosition(
      brick.position.x,
      brick.position.y,
      brick.width,
      brick.height
    );

    this.items.push({
      position: dropPos,
      width: 20,
      height: 20,
      type: itemType,
      velocity: { x: 0, y: 100 },
      color: this.getItemColor(itemType),
    });
  }

  /**
   * 아이템 수집
   */
  private collectItem(item: Item): void {
    const currentTime = Date.now();
    
    // 같은 타입의 기존 효과가 있으면 제거
    const existingEffect = this.effectManager.isEffectActive(item.type);
    if (existingEffect) {
      // 기존 효과 제거
      this.balls.forEach((ball) => {
        this.itemEffectManager.removeEffect(item.type, ball, this.paddle, this.config);
      });
    }
    
    // 상호 배타적 효과 처리 (느린 공 <-> 빠른 공)
    if (item.type === ItemType.SLOW_BALL) {
      // 느린 공을 먹으면 빠른 공 제거
      if (this.effectManager.isEffectActive(ItemType.FAST_BALL)) {
        this.effectManager.removeEffect(ItemType.FAST_BALL);
        this.balls.forEach((ball) => {
          this.itemEffectManager.removeEffect(ItemType.FAST_BALL, ball, this.paddle, this.config);
        });
      }
    } else if (item.type === ItemType.FAST_BALL) {
      // 빠른 공을 먹으면 느린 공 제거
      if (this.effectManager.isEffectActive(ItemType.SLOW_BALL)) {
        this.effectManager.removeEffect(ItemType.SLOW_BALL);
        this.balls.forEach((ball) => {
          this.itemEffectManager.removeEffect(ItemType.SLOW_BALL, ball, this.paddle, this.config);
        });
      }
    }
    
    // 새 효과 추가
    this.effectManager.addEffect(item.type, currentTime);

    // 모든 공에 효과 적용
    this.balls.forEach((ball) => {
      this.itemEffectManager.applyEffect(item.type, ball, this.paddle, this.config, this.balls);
    });
  }

  /**
   * 다음 라운드
   */
  private nextRound(): void {
    // 레이저와 자석 효과 제거 (다음 라운드로 넘어갈 때)
    if (this.effectManager.isEffectActive(ItemType.LASER)) {
      this.effectManager.removeEffect(ItemType.LASER);
      const dummyBall = this.balls[0] || this.createDummyBall();
      this.itemEffectManager.removeEffect(ItemType.LASER, dummyBall, this.paddle, this.config);
    }
    if (this.effectManager.isEffectActive(ItemType.MAGNETIC)) {
      this.effectManager.removeEffect(ItemType.MAGNETIC);
      const dummyBall = this.balls[0] || this.createDummyBall();
      this.itemEffectManager.removeEffect(ItemType.MAGNETIC, dummyBall, this.paddle, this.config);
      this.magneticBall = null;
    }
    
    // 레이저 배열 비우기
    this.lasers = [];
    
    this.roundManager.nextRound();
    this.scoreManager.nextRound();
    this.scoreManager.addRoundBonus(this.roundManager.getRound());
    this.bricks = this.roundManager.generateNewRound(this.config);
    this.resetBall();
    this.items = [];
  }

  /**
   * 더미 공 생성 (효과 제거용)
   */
  private createDummyBall(): Ball {
    return {
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      radius: this.config.ballRadius,
      speed: this.config.ballSpeed,
      color: '#FFFFFF',
    };
  }

  /**
   * 공 발사
   */
  launchBall(): void {
    if (!this.ballLaunched && this.balls.length > 0) {
      const ball = this.balls[0];
      const angle = (Math.random() - 0.5) * Math.PI / 3; // -30도 ~ 30도
      ball.velocity.x = Math.sin(angle) * ball.speed;
      ball.velocity.y = -Math.abs(Math.cos(angle) * ball.speed);
      this.ballLaunched = true;
    }
  }

  /**
   * 자석 공 발사 (마우스 클릭)
   */
  releaseMagneticBall(): void {
    if (this.magneticBall && this.itemEffectManager.hasMagnetic()) {
      this.itemEffectManager.releaseMagneticBall(this.magneticBall);
      this.magneticBall = null;
      this.ballLaunched = true;
    }
  }

  /**
   * 레이저 발사
   */
  private fireLaser(): void {
    if (!this.itemEffectManager.hasLaser()) return;

    // 패들 중앙에서 위로 레이저 발사
    this.lasers.push({
      position: {
        x: this.paddle.position.x + this.paddle.width / 2 - 2,
        y: this.paddle.position.y,
      },
      width: 4,
      height: 20,
    });
  }

  /**
   * 레이저 업데이트
   */
  private updateLasers(deltaTime: number): void {
    const laserSpeed = 800; // 레이저 속도
    this.lasers = this.lasers.filter((laser) => {
      laser.position.y -= laserSpeed * deltaTime;

      // 화면 위로 나갔는지 확인
      if (laser.position.y + laser.height < 0) {
        return false;
      }

      // 벽돌과 충돌 체크
      const hitBrick = this.checkLaserBrickCollision(laser);
      if (hitBrick) {
        hitBrick.health--;
        if (hitBrick.health <= 0) {
          // 점수 추가
          this.scoreManager.addBrickScore(hitBrick, this.roundManager.getRound());

          // 아이템 드롭
          if (hitBrick.canDropItem || ItemDropManager.shouldDropItem(this.roundManager.getRound())) {
            this.dropItem(hitBrick);
          }
        } else {
          // 체력이 남아있으면 색상 업데이트
          hitBrick.color = this.getColorByHealth(hitBrick.health);
        }
        return false; // 레이저 제거
      }

      return true;
    });
  }

  /**
   * 레이저와 벽돌 충돌 체크
   */
  private checkLaserBrickCollision(laser: Laser): Brick | null {
    for (const brick of this.bricks) {
      if (brick.health > 0) {
        if (
          laser.position.x < brick.position.x + brick.width &&
          laser.position.x + laser.width > brick.position.x &&
          laser.position.y < brick.position.y + brick.height &&
          laser.position.y + laser.height > brick.position.y
        ) {
          return brick;
        }
      }
    }
    return null;
  }

  /**
   * 체력에 따른 색상
   */
  private getColorByHealth(health: number): string {
    const colors: Record<number, string> = {
      1: '#FF6B6B',
      2: '#4ECDC4',
      3: '#45B7D1',
    };
    return colors[health] || colors[1];
  }

  /**
   * 아이템 색상
   */
  private getItemColor(type: ItemType): string {
    const colors: Record<ItemType, string> = {
      [ItemType.BIG_BALL]: '#FFD700',
      [ItemType.MULTI_BALL]: '#00FF00',
      [ItemType.SLOW_BALL]: '#4169E1',
      [ItemType.FAST_BALL]: '#FF4500',
      [ItemType.LONG_PADDLE]: '#32CD32',
      [ItemType.SHORT_PADDLE]: '#FF6347',
      [ItemType.LASER]: '#FF00FF',
      [ItemType.MAGNETIC]: '#9370DB',
    };
    return colors[type];
  }

  // Getters
  getState(): GameState {
    return { ...this.state };
  }

  getBalls(): Ball[] {
    return [...this.balls];
  }

  getPaddle(): Paddle {
    return { ...this.paddle };
  }

  getBricks(): Brick[] {
    return [...this.bricks];
  }

  getItems(): Item[] {
    return [...this.items];
  }

  getLasers(): Laser[] {
    return [...this.lasers];
  }

  getConfig(): GameConfig {
    return { ...this.config };
  }

  pause(): void {
    this.state.isPaused = !this.state.isPaused;
  }

  reset(): void {
    this.state = {
      score: 0,
      round: 1,
      lives: 3,
      isPaused: false,
      isGameOver: false,
      activeEffects: [],
    };
    this.roundManager.reset();
    this.scoreManager.reset();
    this.effectManager.clear();
    this.itemEffectManager.reset();
    this.bricks = this.roundManager.generateNewRound(this.config);
    this.items = [];
    this.lasers = [];
    this.resetBall();
  }
}

