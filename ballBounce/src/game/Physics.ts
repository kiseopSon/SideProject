import type { Vector2D, Ball, GameObject } from '../types/game.types';

export class Physics {
  /**
   * 공 위치 업데이트
   */
  static updateBallPosition(ball: Ball, deltaTime: number): void {
    ball.position.x += ball.velocity.x * deltaTime;
    ball.position.y += ball.velocity.y * deltaTime;
  }

  /**
   * 벽과의 충돌 감지 및 반응
   */
  static handleWallCollision(ball: Ball, canvasWidth: number): boolean {
    let bounced = false;

    // 좌우 벽
    if (ball.position.x - ball.radius <= 0 || ball.position.x + ball.radius >= canvasWidth) {
      ball.velocity.x = -ball.velocity.x;
      ball.position.x = Math.max(ball.radius, Math.min(canvasWidth - ball.radius, ball.position.x));
      bounced = true;
    }

    // 위쪽 벽
    if (ball.position.y - ball.radius <= 0) {
      ball.velocity.y = -ball.velocity.y;
      ball.position.y = ball.radius;
      bounced = true;
    }

    return bounced;
  }

  /**
   * 패들과의 충돌 감지
   */
  static checkPaddleCollision(ball: Ball, paddle: GameObject): boolean {
    const closestX = Math.max(paddle.position.x, Math.min(ball.position.x, paddle.position.x + paddle.width));
    const closestY = Math.max(paddle.position.y, Math.min(ball.position.y, paddle.position.y + paddle.height));

    const distanceX = ball.position.x - closestX;
    const distanceY = ball.position.y - closestY;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;

    if (distanceSquared < ball.radius * ball.radius) {
      // 패들 중앙에서의 거리에 따라 각도 조정
      const paddleCenterX = paddle.position.x + paddle.width / 2;
      const hitPos = (ball.position.x - paddleCenterX) / (paddle.width / 2); // -1 ~ 1
      const angle = hitPos * Math.PI / 3; // 최대 60도

      const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
      ball.velocity.x = Math.sin(angle) * speed;
      ball.velocity.y = -Math.abs(Math.cos(angle) * speed); // 항상 위로

      // 공이 패들 안에 들어가지 않도록
      ball.position.y = paddle.position.y - ball.radius;
      return true;
    }

    return false;
  }

  /**
   * 벽돌과의 충돌 감지
   */
  static checkBrickCollision(ball: Ball, brick: GameObject): boolean {
    const closestX = Math.max(brick.position.x, Math.min(ball.position.x, brick.position.x + brick.width));
    const closestY = Math.max(brick.position.y, Math.min(ball.position.y, brick.position.y + brick.height));

    const distanceX = ball.position.x - closestX;
    const distanceY = ball.position.y - closestY;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;

    if (distanceSquared < ball.radius * ball.radius) {
      // 충돌 방향 결정
      const ballCenterX = ball.position.x;
      const ballCenterY = ball.position.y;
      const brickCenterX = brick.position.x + brick.width / 2;
      const brickCenterY = brick.position.y + brick.height / 2;

      const dx = ballCenterX - brickCenterX;
      const dy = ballCenterY - brickCenterY;

      // 더 가까운 면에 따라 반사
      if (Math.abs(dx / brick.width) > Math.abs(dy / brick.height)) {
        ball.velocity.x = -ball.velocity.x;
      } else {
        ball.velocity.y = -ball.velocity.y;
      }

      return true;
    }

    return false;
  }

  /**
   * 아이템과 패들의 충돌 감지
   */
  static checkItemCollision(item: GameObject, paddle: GameObject): boolean {
    return (
      item.position.x < paddle.position.x + paddle.width &&
      item.position.x + item.width > paddle.position.x &&
      item.position.y < paddle.position.y + paddle.height &&
      item.position.y + item.height > paddle.position.y
    );
  }

  /**
   * 공이 화면 밖으로 나갔는지 확인
   */
  static isBallOutOfBounds(ball: Ball, canvasHeight: number): boolean {
    return ball.position.y - ball.radius > canvasHeight;
  }

  /**
   * 속도 정규화
   */
  static normalizeVelocity(velocity: Vector2D, speed: number): Vector2D {
    const magnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
    if (magnitude === 0) return { x: 0, y: -speed };
    return {
      x: (velocity.x / magnitude) * speed,
      y: (velocity.y / magnitude) * speed,
    };
  }
}

