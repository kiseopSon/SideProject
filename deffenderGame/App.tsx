import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useGameStore } from './src/store/gameStore';
import { MenuScreen } from './src/components/MenuScreen';
import { GameScreen } from './src/components/GameScreen';
import { GameOverScreen } from './src/components/GameOverScreen';

export default function App() {
  const phase = useGameStore((state) => state.phase);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      {phase === 'menu' && <MenuScreen />}
      {phase === 'playing' && <GameScreen />}
      {phase === 'paused' && <GameScreen />}
      {phase === 'gameover' && (
        <>
          <GameScreen />
          <GameOverScreen />
        </>
      )}
    </GestureHandlerRootView>
  );
}
