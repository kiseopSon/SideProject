import { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/GameEngine';
import type { GameConfig, GameState } from '../types/game.types';
import { ITEM_CONFIGS } from '../items/ItemTypes';
import styles from './GameCanvas.module.css';

interface GameCanvasProps {
  width?: number;
  height?: number;
}

export default function GameCanvas({ width, height }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouseX, setMouseX] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    round: 1,
    lives: 3,
    isPaused: false,
    isGameOver: false,
    activeEffects: [],
  });

  // 화면 크기 계산 및 반응형 처리
  useEffect(() => {
    const updateCanvasSize = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const maxWidth = Math.min(containerWidth - 40, 800); // 패딩 고려
      const aspectRatio = 4 / 3; // 4:3 비율
      const calculatedHeight = maxWidth / aspectRatio;
      const maxHeight = window.innerHeight * 0.7; // 화면 높이의 70%
      
      const finalWidth = Math.min(maxWidth, maxHeight * aspectRatio);
      const finalHeight = finalWidth / aspectRatio;
      
      setCanvasSize({ width: finalWidth, height: finalHeight });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  // 게임 엔진 초기화
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width: canvasWidth, height: canvasHeight } = canvasSize;
    
    // 모바일 여부 확인
    const isMobile = window.innerWidth < 768;
    
    // 게임 설정 (화면 크기에 따라 조정)
    const config: GameConfig = {
      canvasWidth,
      canvasHeight,
      paddleWidth: isMobile ? canvasWidth * 0.2 : 100,
      paddleHeight: isMobile ? 12 : 15,
      paddleSpeed: 500,
      ballRadius: isMobile ? 8 : 10,
      ballSpeed: isMobile ? 250 : 300,
      brickRows: isMobile ? 4 : 5,
      brickCols: isMobile ? 6 : 10,
      brickWidth: isMobile ? (canvasWidth - 40) / 6 - 5 : 70,
      brickHeight: isMobile ? 20 : 25,
      brickPadding: isMobile ? 3 : 5,
      itemDropChance: 0.15,
    };

    // 게임 엔진 초기화
    if (!gameEngineRef.current) {
      gameEngineRef.current = new GameEngine(config);
    } else {
      // 기존 게임 엔진이 있으면 설정 업데이트 (리셋)
      gameEngineRef.current = new GameEngine(config);
    }
  }, [canvasSize]);

  // 게임 루프 및 이벤트 핸들러
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameEngineRef.current) return;

    const gameEngine = gameEngineRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 마우스/터치 이벤트
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
      if (clientX !== undefined) {
        const x = clientX - rect.left;
        setMouseX(x);
      }
    };

    // 마우스/터치 클릭 이벤트 (공 발사 또는 자석 공 발사)
    const handlePointerClick = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const state = gameEngine.getState();
      if (!state.isPaused && !state.isGameOver) {
        // 자석 효과가 있고 공이 달라붙어 있으면 자석 공 발사
        gameEngine.releaseMagneticBall();
        
        // 공이 발사되지 않았으면 일반 공 발사
        if (!gameEngine.getState().isGameOver) {
          gameEngine.launchBall();
        }
        
        setGameState(gameEngine.getState());
      }
    };

    // 키보드 이벤트
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'KeyP') {
        gameEngine.pause();
        setGameState(gameEngine.getState());
      } else if (e.code === 'KeyR') {
        const state = gameEngine.getState();
        if (state.isGameOver) {
          gameEngine.reset();
          setGameState(gameEngine.getState());
        }
      }
    };

    // 마우스 이벤트
    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('click', handlePointerClick);
    
    // 터치 이벤트 (모바일)
    canvas.addEventListener('touchmove', handlePointerMove, { passive: false });
    canvas.addEventListener('touchstart', handlePointerClick, { passive: false });
    
    window.addEventListener('keydown', handleKeyPress);

    // 게임 루프
    const gameLoop = (currentTime: number) => {
      if (!gameEngineRef.current) return;

      // 게임 업데이트
      gameEngineRef.current.update(currentTime, mouseX);

      // 상태 업데이트 (활성 효과도 비교)
      const newState = gameEngineRef.current.getState();
      setGameState((prevState) => {
        // 활성 효과 비교 (타입 목록을 정렬해서 비교)
        const prevTypes = prevState.activeEffects.map(e => e.type).sort().join(',');
        const newTypes = newState.activeEffects.map(e => e.type).sort().join(',');
        const effectsChanged = prevTypes !== newTypes;
        
        if (
          prevState.score !== newState.score ||
          prevState.round !== newState.round ||
          prevState.lives !== newState.lives ||
          prevState.isPaused !== newState.isPaused ||
          prevState.isGameOver !== newState.isGameOver ||
          effectsChanged
        ) {
          return newState;
        }
        return prevState;
      });

      // 렌더링
      if (ctx) {
        const { width: canvasWidth, height: canvasHeight } = canvasSize;
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        drawGame(ctx, gameEngineRef.current, canvasWidth, canvasHeight);
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      canvas.removeEventListener('mousemove', handlePointerMove);
      canvas.removeEventListener('click', handlePointerClick);
      canvas.removeEventListener('touchmove', handlePointerMove);
      canvas.removeEventListener('touchstart', handlePointerClick);
      window.removeEventListener('keydown', handleKeyPress);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [canvasSize, mouseX]);

  const drawGame = (
    ctx: CanvasRenderingContext2D,
    gameEngine: GameEngine,
    width: number,
    height: number
  ) => {
    // 배경
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    // 벽돌 그리기
    gameEngine.getBricks().forEach((brick) => {
      if (brick.health > 0) {
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.position.x, brick.position.y, brick.width, brick.height);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(brick.position.x, brick.position.y, brick.width, brick.height);
      }
    });

    // 아이템 그리기
    gameEngine.getItems().forEach((item) => {
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(item.position.x, item.position.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // 레이저 그리기
    gameEngine.getLasers().forEach((laser) => {
      ctx.fillStyle = '#FF00FF';
      ctx.fillRect(laser.position.x, laser.position.y, laser.width, laser.height);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(laser.position.x, laser.position.y, laser.width, laser.height);
    });

    // 공 그리기
    gameEngine.getBalls().forEach((ball) => {
      ctx.fillStyle = ball.color;
      ctx.beginPath();
      ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // 패들 그리기
    const paddle = gameEngine.getPaddle();
    ctx.fillStyle = paddle.color;
    ctx.fillRect(paddle.position.x, paddle.position.y, paddle.width, paddle.height);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(paddle.position.x, paddle.position.y, paddle.width, paddle.height);
  };

  return (
    <div className={styles.gameContainer} ref={containerRef}>
      <div className={styles.gameInfo}>
        <div>점수: {gameState.score}</div>
        <div>라운드: {gameState.round}</div>
        <div>생명: {gameState.lives}</div>
        {gameState.isPaused && <div className={styles.pauseText}>일시정지 (P키로 재개)</div>}
        {gameState.isGameOver && (
          <div className={styles.gameOverText}>
            게임 오버! (R키로 재시작)
          </div>
        )}
        {gameState.activeEffects.length > 0 && (
          <div className={styles.effects}>
            활성 효과:
            {gameState.activeEffects.map((effect) => {
              const config = ITEM_CONFIGS[effect.type as keyof typeof ITEM_CONFIGS];
              return (
                <span key={effect.type} className={styles.effect} title={config.description}>
                  {config.name}
                </span>
              );
            })}
          </div>
        )}
      </div>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className={styles.canvas}
      />
      <div className={styles.instructions}>
        <p>화면을 터치하거나 마우스를 움직여 패들을 조작하세요</p>
        <p>터치/클릭: 공 발사 (자석 효과 시 자석 공 발사) | P: 일시정지 | R: 재시작</p>
      </div>
    </div>
  );
}

