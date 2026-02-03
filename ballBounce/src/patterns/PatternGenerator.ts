import type { Brick, GameConfig } from '../types/game.types';

export class PatternGenerator {
  /**
   * 기본 그리드 패턴
   */
  static generateGridPattern(config: GameConfig, round: number): Brick[] {
    const bricks: Brick[] = [];
    const rows = Math.min(config.brickRows + Math.floor(round / 2), 8);
    const cols = config.brickCols;

    const startX = (config.canvasWidth - (cols * (config.brickWidth + config.brickPadding) - config.brickPadding)) / 2;
    const startY = 50;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * (config.brickWidth + config.brickPadding);
        const y = startY + row * (config.brickHeight + config.brickPadding);

        // 라운드에 따라 체력 증가
        const health = Math.min(1 + Math.floor(round / 3), 3);
        const points = health * 10;

        bricks.push({
          position: { x, y },
          width: config.brickWidth,
          height: config.brickHeight,
          color: PatternGenerator.getColorByHealth(health),
          points,
          health,
          maxHealth: health,
          canDropItem: Math.random() < 0.5, // 50% 확률로 아이템 드롭 가능
        });
      }
    }

    return bricks;
  }

  /**
   * 피라미드 패턴
   */
  static generatePyramidPattern(config: GameConfig, round: number): Brick[] {
    const bricks: Brick[] = [];
    const maxCols = Math.min(config.brickCols, 8);
    const startX = config.canvasWidth / 2;
    const startY = 50;

    for (let row = 0; row < maxCols; row++) {
      const colsInRow = maxCols - row;
      const brickWidth = config.brickWidth;
      const totalWidth = colsInRow * (brickWidth + config.brickPadding) - config.brickPadding;
      const rowStartX = startX - totalWidth / 2;

      for (let col = 0; col < colsInRow; col++) {
        const x = rowStartX + col * (brickWidth + config.brickPadding);
        const y = startY + row * (config.brickHeight + config.brickPadding);

        const health = Math.min(1 + Math.floor(round / 3), 3);
        const points = health * 10;

        bricks.push({
          position: { x, y },
          width: brickWidth,
          height: config.brickHeight,
          color: PatternGenerator.getColorByHealth(health),
          points,
          health,
          maxHealth: health,
          canDropItem: Math.random() < 0.3,
        });
      }
    }

    return bricks;
  }

  /**
   * 랜덤 패턴
   */
  static generateRandomPattern(config: GameConfig, round: number): Brick[] {
    const bricks: Brick[] = [];
    const rows = Math.min(config.brickRows + Math.floor(round / 2), 8);
    const cols = config.brickCols;

    const startX = (config.canvasWidth - (cols * (config.brickWidth + config.brickPadding) - config.brickPadding)) / 2;
    const startY = 50;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // 70% 확률로 벽돌 생성
        if (Math.random() < 0.7) {
          const x = startX + col * (config.brickWidth + config.brickPadding);
          const y = startY + row * (config.brickHeight + config.brickPadding);

          const health = Math.min(1 + Math.floor(round / 3), 3);
          const points = health * 10;

          bricks.push({
            position: { x, y },
            width: config.brickWidth,
            height: config.brickHeight,
            color: PatternGenerator.getColorByHealth(health),
            points,
            health,
            maxHealth: health,
            canDropItem: Math.random() < 0.3,
          });
        }
      }
    }

    return bricks;
  }

  /**
   * 체크보드 패턴
   */
  static generateCheckerboardPattern(config: GameConfig, round: number): Brick[] {
    const bricks: Brick[] = [];
    const rows = Math.min(config.brickRows + Math.floor(round / 2), 8);
    const cols = config.brickCols;

    const startX = (config.canvasWidth - (cols * (config.brickWidth + config.brickPadding) - config.brickPadding)) / 2;
    const startY = 50;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // 체크보드 패턴
        if ((row + col) % 2 === 0) {
          const x = startX + col * (config.brickWidth + config.brickPadding);
          const y = startY + row * (config.brickHeight + config.brickPadding);

          const health = Math.min(1 + Math.floor(round / 3), 3);
          const points = health * 10;

          bricks.push({
            position: { x, y },
            width: config.brickWidth,
            height: config.brickHeight,
            color: PatternGenerator.getColorByHealth(health),
            points,
            health,
            maxHealth: health,
            canDropItem: Math.random() < 0.3,
          });
        }
      }
    }

    return bricks;
  }

  /**
   * 패턴 선택 (라운드에 따라)
   */
  static generatePattern(config: GameConfig, round: number): Brick[] {
    const patterns = [
      this.generateGridPattern,
      this.generatePyramidPattern,
      this.generateRandomPattern,
      this.generateCheckerboardPattern,
    ];

    // 라운드에 따라 패턴 선택
    const patternIndex = (round - 1) % patterns.length;
    return patterns[patternIndex](config, round);
  }

  /**
   * 체력에 따른 색상 반환
   */
  static getColorByHealth(health: number): string {
    const colors: Record<number, string> = {
      1: '#FF6B6B', // 빨강
      2: '#4ECDC4', // 청록
      3: '#45B7D1', // 파랑
    };
    return colors[health] || colors[1];
  }
}

