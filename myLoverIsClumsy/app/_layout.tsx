import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import * as SplashScreen from 'expo-splash-screen';

// SplashScreen 초기화 - 에러가 나도 앱이 크래시하지 않도록
let splashScreenInitialized = false;
try {
  SplashScreen.preventAutoHideAsync()
    .then(() => {
      splashScreenInitialized = true;
    })
    .catch(() => {
      splashScreenInitialized = false;
    });
} catch {
  splashScreenInitialized = false;
}

// 알림 컴포넌트 - lazy load로 안전하게 처리
import { useNotifications } from '@/hooks/useNotifications';

function NotificationInitializer() {
  // 훅을 컴포넌트 내부에서 직접 호출 (Rules of Hooks 준수)
  // useNotifications 훅 내부에서 플랫폼 체크를 수행
  useNotifications();

  return null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const { setUser } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // 환경 변수 확인 (에러가 나도 계속 진행)
    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      
      if (__DEV__) {
        console.log('🔍 환경 변수 체크:');
        console.log('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ 설정됨' : '❌ 없음');
        console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ 설정됨' : '❌ 없음');
      }
    } catch {
      // 환경 변수 확인 실패해도 계속 진행
    }

    // 앱 시작 시 현재 사용자 확인 - lazy load authService
    const initAuth = async () => {
      try {
        // authService를 동적으로 import하여 모듈 로드 시점 에러 방지
        const { authService } = await import('@/services/authService');
        const user = await authService.getCurrentUser();
        setUser(user || null);
      } catch (error: any) {
        // 어떤 에러가 나더라도 앱은 실행되도록
        if (__DEV__) {
          console.warn('Auth init:', error?.message || 'Unknown error');
        }
        setUser(null);
      } finally {
        setIsReady(true);
        // SplashScreen 숨기기 (에러가 나도 계속 진행)
        if (splashScreenInitialized) {
          try {
            await SplashScreen.hideAsync();
          } catch {
            // 무시
          }
        }
      }
    };

    // 약간의 지연 후 초기화 (네이티브 모듈 준비 대기)
    const timer = setTimeout(() => {
      initAuth();
    }, 200);

    return () => clearTimeout(timer);
  }, [setUser]);

  if (!isReady) {
    // null 대신 빈 View 반환 - React Native에서 null 반환 시 문제 발생 방지
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B9D" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <NotificationInitializer />
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF6B9D',
  },
});
