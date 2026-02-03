import { create } from 'zustand';
import { GameState, Unit, Monster, Projectile, UnitType, MonsterType, Position, DamageIndicator } from '../types/game';
import { UNIT_CONFIGS } from '../config/unitConfigs';
import { generateWaveMonsters, getMonsterHealth, MONSTER_CONFIGS } from '../config/monsterConfigs';
import { getPositionOnPath, isNearPath, setWave, generateNewMap } from '../config/pathConfig';

interface GameStore extends GameState {
  // Actions
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  gameOver: () => void;
  selectUnitType: (type: UnitType | null) => void;
  placeUnit: (position: Position) => void;
  updateGame: (deltaTime: number) => void;
  startNextWave: () => void;
  resetGame: () => void;
  addDamageIndicator: (indicator: Omit<DamageIndicator, 'id' | 'createdAt'>) => void;
  removeDamageIndicator: (id: string) => void;
}

const INITIAL_STATE: GameState = {
  phase: 'menu',
  wave: 0,
  gold: 100,
  castleHealth: 100,
  maxCastleHealth: 100,
  units: [],
  monsters: [],
  projectiles: [],
  selectedUnitType: null,
  gameSpeed: 1,
  nextMonsterSpawnTime: 0,
  monstersToSpawn: [],
  damageIndicators: [],
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL_STATE,

  startGame: () => {
    set({
      ...INITIAL_STATE,
      phase: 'playing',
      wave: 1, 
      gold: 100, // 시작 골드 100원
    });
    // 약간의 지연 후 웨이브 시작 (게임 루프가 시작될 시간을 줌)
    setTimeout(() => {
      get().startNextWave();
    }, 500);
  },

  pauseGame: () => set({ phase: 'paused' }),
  resumeGame: () => set({ phase: 'playing' }),
  gameOver: () => set({ phase: 'gameover' }),

  selectUnitType: (type) => set({ selectedUnitType: type }),

  placeUnit: (position) => {
    const state = get();
    
    // playing, paused, preparing 상태에서 유닛 배치 가능
    if (!state.selectedUnitType || (state.phase !== 'playing' && state.phase !== 'paused' && state.phase !== 'preparing')) {
      return;
    }

    const config = UNIT_CONFIGS[state.selectedUnitType];
    
    // 같은 위치에 같은 타입의 유닛이 있는지 확인 (강화 시스템)
    const existingUnitIndex = state.units.findIndex(
      (u) => u.type === state.selectedUnitType && 
             Math.abs(u.position.x - position.x) < 50 && 
             Math.abs(u.position.y - position.y) < 50
    );
    
    if (existingUnitIndex !== -1) {
      // 같은 위치, 같은 타입 유닛이 있으면 강화
      const existingUnit = state.units[existingUnitIndex];
      const upgradeCost = Math.floor(config.cost * (existingUnit.level * 0.8)); // 레벨마다 비용 증가 (80%)
      
      if (state.gold < upgradeCost) {
        return;
      }
      
      // 강화: 데미지 50% 증가, 체력 30% 증가, 레벨 +1
      const upgradedUnit: Unit = {
        ...existingUnit,
        level: existingUnit.level + 1,
        damage: Math.floor(existingUnit.damage * 1.5),
        maxHealth: Math.floor(existingUnit.maxHealth * 1.3),
        health: Math.floor(existingUnit.maxHealth * 1.3), // 체력 회복
      };
      
      const updatedUnits = [...state.units];
      updatedUnits[existingUnitIndex] = upgradedUnit;
      
      set({
        units: updatedUnits,
        gold: state.gold - upgradeCost,
        selectedUnitType: null,
      });
      return;
    }

    // 다른 유닛이 있는지 확인
    const hasUnit = state.units.some(
      (u) => Math.abs(u.position.x - position.x) < 50 && Math.abs(u.position.y - position.y) < 50
    );
    if (hasUnit) {
      return;
    }

    // 경로 근처에는 유닛을 배치할 수 없음
    if (isNearPath(position, 35)) {
      return;
    }

    if (state.gold < config.cost) {
      return;
    }

    const newUnit: Unit = {
      id: `unit-${Date.now()}-${Math.random()}`,
      type: state.selectedUnitType,
      position,
      health: config.baseHealth,
      maxHealth: config.baseHealth,
      damage: config.baseDamage,
      attackRange: config.attackRange,
      attackSpeed: config.attackSpeed,
      lastAttackTime: 0,
      cost: config.cost,
      level: 1,
    };

    set({
      units: [...state.units, newUnit],
      gold: state.gold - config.cost,
      selectedUnitType: null,
    });
  },

  startNextWave: () => {
    const state = get();
    const wave = state.wave;
    
    // 웨이브가 시작될 때 경로 난이도 업데이트
    setWave(wave);
    
    const monsterConfigs = generateWaveMonsters(wave);

    // 몬스터를 스폰 큐에 추가 (시간차로 스폰)
    const monstersToSpawn: Array<{ type: MonsterType; spawnTime: number }> = [];
    let currentTime = Date.now();
    const spawnInterval = 800; // 0.8초마다 몬스터 스폰 (더 빠르게)

    monsterConfigs.forEach(({ type, count }) => {
      for (let i = 0; i < count; i++) {
        monstersToSpawn.push({
          type,
          spawnTime: currentTime + i * spawnInterval,
        });
      }
      currentTime += count * spawnInterval;
    });

    set({ 
      monstersToSpawn,
      nextMonsterSpawnTime: monstersToSpawn.length > 0 ? monstersToSpawn[0].spawnTime : 0,
    });
  },

  updateGame: (deltaTime: number) => {
    const state = get();
    // preparing 상태에서는 게임 업데이트 안 함 (배치만 가능)
    // 15초 대기는 setTimeout으로만 처리 (여기서는 체크 안 함)
    if (state.phase !== 'playing') {
      return;
    }

    const currentTime = Date.now();
    const { units, monsters, projectiles, castleHealth, monstersToSpawn, wave } = state;

    // 몬스터 스폰 처리 (시간차 스폰)
    let newMonsters = [...monsters];
    let remainingMonstersToSpawn = [...monstersToSpawn];
    
    while (remainingMonstersToSpawn.length > 0 && remainingMonstersToSpawn[0].spawnTime <= currentTime) {
      const { type } = remainingMonstersToSpawn[0];
      const config = MONSTER_CONFIGS[type];
      const monsterId = `monster-${Date.now()}-${Math.random()}`;
      
      newMonsters.push({
        id: monsterId,
        type,
        position: { x: -50, y: 300 + (newMonsters.length % 3) * 80 },
        health: getMonsterHealth(type, wave),
        maxHealth: getMonsterHealth(type, wave),
        // 임시: 4라운드 테스트용으로 속도도 1라운드 수준으로
        speed: config.speed * 0.3, // 모든 웨이브를 1라운드 속도로 (테스트용)
        goldReward: config.goldReward,
        progress: 0,
      });
      
      remainingMonstersToSpawn.shift();
    }

    // 다음 스폰 시간 업데이트
    const nextSpawnTime = remainingMonstersToSpawn.length > 0 
      ? remainingMonstersToSpawn[0].spawnTime 
      : 0;

    // 남은 몬스터가 없고 스폰할 몬스터도 없으면 웨이브 클리어 조건 확인용
    const allMonstersCleared = remainingMonstersToSpawn.length === 0;

    // 1. 몬스터 이동 업데이트
    // deltaTime이 너무 크면 (예: 첫 프레임) 정상화
    const normalizedDeltaTime = Math.min(deltaTime, 100); // 최대 100ms로 제한
    
    const updatedMonsters = newMonsters
      .map((monster) => {
        // 진행도를 증가 (경로 길이 기준으로 웨이브 1에서 약 30초 정도 걸리도록)
        const progressIncrement = (monster.speed * normalizedDeltaTime) / 30000;
        const newProgress = Math.min(1, monster.progress + progressIncrement);
        
        // 고정된 경로를 따라 이동
        const pathPosition = getPositionOnPath(newProgress);

        return {
          ...monster,
          progress: newProgress,
          position: pathPosition,
        };
      })
      .filter((monster) => {
        // 성에 도달한 몬스터 처리
        if (monster.progress >= 1) {
          const damage = Math.floor(monster.maxHealth * 0.1); // 몬스터 체력의 10% 데미지
          const newCastleHealth = Math.max(0, castleHealth - damage);
          if (newCastleHealth <= 0) {
            setTimeout(() => get().gameOver(), 100);
          } else {
            set({ castleHealth: newCastleHealth });
          }
          return false; // 몬스터 제거
        }
        return monster.health > 0; // 살아있는 몬스터만 유지
      });

    // 2. 유닛 공격 처리
    const newProjectiles: Projectile[] = [...projectiles];
    let goldEarned = 0;

    // 힐러 처리 (먼저 수행)
    let unitsToHeal: { id: string; healAmount: number }[] = [];
    units.forEach((unit) => {
      if (unit.type === 'healer' && unit.health > 0 && currentTime - unit.lastAttackTime >= unit.attackSpeed) {
        const nearbyAllies = units.filter((u) => {
          if (u.id === unit.id || u.health >= u.maxHealth) return false;
          const distance = Math.sqrt(
            Math.pow(unit.position.x - u.position.x, 2) +
            Math.pow(unit.position.y - u.position.y, 2)
          );
          return distance <= unit.attackRange;
        });

        nearbyAllies.forEach((ally) => {
          const existing = unitsToHeal.find((h) => h.id === ally.id);
          if (existing) {
            existing.healAmount += unit.damage * 2;
          } else {
            unitsToHeal.push({ id: ally.id, healAmount: unit.damage * 2 });
          }
        });

        if (nearbyAllies.length > 0) {
          // 힐러도 공격 시간 업데이트
          unitsToHeal.push({ id: unit.id, healAmount: 0 }); // 마커용
        }
      }
    });

    // 힐 인디케이터를 수집하기 위한 배열
    const healIndicators: Array<Omit<DamageIndicator, 'id' | 'createdAt'>> = [];
    
    const updatedUnits = units.map((unit) => {
      if (unit.health <= 0) return unit;

      // 힐러는 몬스터를 공격하지 않음
      if (unit.type === 'healer') {
        const healAction = unitsToHeal.find((h) => h.id === unit.id);
        if (healAction) {
          return { ...unit, lastAttackTime: currentTime };
        }
        return unit;
      }

      // 공격 가능한 몬스터 찾기 (가장 가까운 몬스터 선택)
      let targetMonster: typeof updatedMonsters[0] | undefined = undefined;
      let minDistance = unit.attackRange;
      
      for (const monster of updatedMonsters) {
        const distance = Math.sqrt(
          Math.pow(unit.position.x - monster.position.x, 2) +
            Math.pow(unit.position.y - monster.position.y, 2)
        );
        if (distance <= unit.attackRange && distance < minDistance) {
          targetMonster = monster;
          minDistance = distance;
        }
      }

      if (targetMonster && currentTime - unit.lastAttackTime >= unit.attackSpeed) {
        // 일반 유닛은 투사체 발사
        const projectileType = unit.type === 'wizard' ? 'magic' : unit.type === 'assassin' ? 'dagger' : 'arrow';
        
        
        newProjectiles.push({
          id: `projectile-${Date.now()}-${Math.random()}`,
          fromUnitId: unit.id,
          targetMonsterId: targetMonster.id,
          position: { ...unit.position },
          targetPosition: { ...targetMonster.position },
          damage: unit.damage,
          speed: 0.3, // 픽셀/밀리초 단위로 변경 (deltaTime 적용됨)
          type: projectileType,
        });

        return { ...unit, lastAttackTime: currentTime };
      }

      // 힐링 적용
      const healAction = unitsToHeal.find((h) => h.id === unit.id && h.healAmount > 0);
      if (healAction) {
        // 힐 인디케이터 수집
        healIndicators.push({
          damage: healAction.healAmount,
          position: { ...unit.position },
          type: 'heal',
        });
        return { ...unit, health: Math.min(unit.maxHealth, unit.health + healAction.healAmount) };
      }

      return unit;
    });

    // 3. 투사체 이동 및 충돌 처리
    // 먼저 모든 충돌을 수집하고 몬스터별로 데미지를 누적한 후 한 번에 적용
    const activeProjectiles: Projectile[] = [];
    const finalMonsters = [...updatedMonsters];
    const newDamageIndicators: Array<Omit<DamageIndicator, 'id' | 'createdAt'>> = [];
    
    // 몬스터별 누적 데미지와 인디케이터 정보 저장
    const monsterDamageMap = new Map<string, { totalDamage: number; position: Position; monster: Monster }>();
    
    // 첫 번째 패스: 충돌 검사 및 데미지 누적
    newProjectiles.forEach((projectile) => {
      const target = finalMonsters.find((m) => m.id === projectile.targetMonsterId);
      if (!target) {
        // 타겟이 사라졌으면 투사체 제거
        return;
      }

      // 투사체 이동 (deltaTime 기반)
      const dx = target.position.x - projectile.position.x;
      const dy = target.position.y - projectile.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 충돌 체크 (더 작은 거리로 조정)
      if (distance < 30) {
        // 충돌! 데미지 누적
        if (!monsterDamageMap.has(target.id)) {
          monsterDamageMap.set(target.id, {
            totalDamage: 0,
            position: { ...target.position },
            monster: target,
          });
        }
        const damageInfo = monsterDamageMap.get(target.id)!;
        damageInfo.totalDamage += projectile.damage;
        // 투사체는 충돌 후 제거됨 (activeProjectiles에 추가하지 않음)
      } else {
        // 투사체 계속 이동 (deltaTime 기반, 픽셀/밀리초)
        // speed는 픽셀/밀리초 단위이므로 deltaTime을 곱함
        const moveDistance = projectile.speed * deltaTime;
        const moveX = (dx / distance) * moveDistance;
        const moveY = (dy / distance) * moveDistance;
        activeProjectiles.push({
          ...projectile,
          position: {
            x: projectile.position.x + moveX,
            y: projectile.position.y + moveY,
          },
        });
      }
    });
    
    // 두 번째 패스: 누적된 데미지를 몬스터에 적용
    monsterDamageMap.forEach((damageInfo, monsterId) => {
      const monsterIndex = finalMonsters.findIndex((m) => m.id === monsterId);
      if (monsterIndex === -1) return;
      
      const monster = damageInfo.monster;
      const newHealth = Math.max(0, monster.health - damageInfo.totalDamage); // 음수 방지
      
      
      // 데미지 인디케이터 추가
      newDamageIndicators.push({
        damage: damageInfo.totalDamage,
        position: damageInfo.position,
        type: 'damage',
      });
      
      // 체력 업데이트
      finalMonsters[monsterIndex] = { ...finalMonsters[monsterIndex], health: newHealth };
      
      // 몬스터가 죽었는지 확인
      if (newHealth <= 0) {
        goldEarned += monster.goldReward;
        
        // 5의 배수 웨이브 보스 처치 확인 (5, 10, 15, 20...)
        if (monster.type === 'boss' && state.wave % 5 === 0) {
          // 모든 유닛 비용 환불
          const totalRefund = state.units.reduce((sum, unit) => {
            // 유닛 원래 비용 계산 (레벨 1 기준)
            const baseCost = UNIT_CONFIGS[unit.type].cost;
            let refund = baseCost;
            // 강화 비용도 환불 (레벨 2 이상인 경우)
            for (let level = 2; level <= unit.level; level++) {
              refund += Math.floor(baseCost * ((level - 1) * 0.8));
            }
            return sum + refund;
          }, 0);
          
          
          // 준비 상태로 전환 (15초 대기)
          const preparationEndTime = currentTime + 15000;
          
          // 맵 변경 (즉시 실행)
          generateNewMap();
          
          // 먼저 유닛 초기화 및 preparing 상태 설정
          const newGold = state.gold + totalRefund + goldEarned;
          
          // 현재 웨이브 저장 (5의 배수 웨이브)
          const currentWaveForReset = state.wave;
          
          // 즉시 상태 변경하고 함수 종료 (다른 로직이 실행되지 않도록)
          set({
            phase: 'preparing',
            gold: newGold,
            units: [], // 유닛 초기화 - 반드시 빈 배열!
            monsters: [],
            projectiles: [],
            monstersToSpawn: [],
            preparationEndTime,
            wave: currentWaveForReset, // 현재 웨이브 유지 (5, 10, 15, 20...)
            castleHealth: state.maxCastleHealth, // 성 체력 회복
            damageIndicators: [], // 데미지 인디케이터도 초기화
          });
          
          
          // 정확히 15초 후에만 다음 웨이브로 진행 (현재 웨이브 + 1)
          setTimeout(() => {
            const currentState = get();
            // preparing 상태이고 현재 웨이브가 5의 배수인지 확인
            if (currentState.phase === 'preparing' && currentState.wave % 5 === 0) {
              set({
                phase: 'playing',
                preparationEndTime: undefined,
                wave: currentState.wave + 1, // 현재 웨이브 + 1 (5→6, 10→11, 15→16...)
              });
              get().startNextWave();
            }
          }, 15000);
          
          // 즉시 return하여 updateGame의 나머지 로직(특히 마지막 set() 호출)이 실행되지 않도록 함
          // 이렇게 하지 않으면 마지막 set()이 preparing 상태를 덮어씀
          return;
        }
      }
    });

    // 4. 모든 몬스터 처치 및 스폰 완료 시 다음 웨이브
    // 단, preparing 상태가 아닐 때만 처리 (5의 배수 웨이브 보스 처치는 위에서 처리됨)
    const hasMonstersInWave = monsters.length > 0 || monstersToSpawn.length > 0;
    const allCleared = finalMonsters.length === 0 && remainingMonstersToSpawn.length === 0 && hasMonstersInWave;
    // 5의 배수 웨이브가 아닐 때만 자동으로 다음 웨이브로 (5의 배수는 보스 처치 로직에서 처리)
    if (allCleared && state.phase === 'playing' && state.wave % 5 !== 0) {
      // 일반 웨이브 클리어 - 준비 화면 표시 후 다음 웨이브 시작
      const currentState = get();
      const preparationEndTime = currentTime + 3000; // 3초 준비 시간
      
      set({
        phase: 'preparing',
        preparationEndTime,
        gold: currentState.gold + 50, // 웨이브 클리어 보너스
      });
      
      // 3초 후 다음 웨이브 시작
      setTimeout(() => {
        const stateBeforeNext = get();
        if (stateBeforeNext.phase === 'preparing') {
          set({
            phase: 'playing',
            wave: stateBeforeNext.wave + 1,
            preparationEndTime: undefined,
          });
          get().startNextWave();
        }
      }, 3000);
    }

    // 5. 새로운 데미지 인디케이터 생성 및 오래된 것 제거
    // currentTime은 이미 함수 시작 부분에서 선언됨
    const existingIndicators = state.damageIndicators.filter(
      (indicator) => currentTime - indicator.createdAt < 1000
    );
    
    // 모든 새로운 인디케이터 합치기
    const allNewIndicators = [...newDamageIndicators, ...healIndicators];
    const addedIndicators: DamageIndicator[] = allNewIndicators.map((indicator) => ({
      ...indicator,
      id: `damage-${currentTime}-${Math.random()}`,
      createdAt: currentTime,
    }));

    // 6. 상태 업데이트 (preparing 상태가 아닐 때만 실행)
    const currentStateAfterBoss = get();
    if (currentStateAfterBoss.phase !== 'preparing') {
      set({
        units: updatedUnits.filter((u) => u.health > 0),
        monsters: finalMonsters,
        projectiles: activeProjectiles,
        gold: state.gold + goldEarned,
        monstersToSpawn: remainingMonstersToSpawn,
        nextMonsterSpawnTime: nextSpawnTime,
        damageIndicators: [...existingIndicators, ...addedIndicators],
      });
    } else {
      // preparing 상태면 업데이트하지 않음 (이미 위에서 설정됨)
    }
  },

  addDamageIndicator: (indicator) => {
    const state = get();
    const currentTime = Date.now();
    const newIndicator: DamageIndicator = {
      ...indicator,
      id: `damage-${currentTime}-${Math.random()}`,
      createdAt: Date.now(),
    };
    set({
      damageIndicators: [...state.damageIndicators, newIndicator],
    });
  },

  removeDamageIndicator: (id) => {
    const state = get();
    set({
      damageIndicators: state.damageIndicators.filter((ind) => ind.id !== id),
    });
  },

  resetGame: () => set(INITIAL_STATE),
}));
