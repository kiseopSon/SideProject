import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { notificationService } from '@/services/notificationService';

export function useNotifications() {
  // 웹에서는 알림이 지원되지 않으므로 조기 반환
  if (Platform.OS === 'web') {
    return;
  }

  const { user } = useAuthStore();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    if (!user) return;

    // 알림 설정은 에러가 발생해도 앱이 크래시하지 않도록 try-catch
    const setupNotifications = async () => {
      try {
        console.log('🔔 알림 설정 시작...');
        
        // 알림 권한 요청
        const hasPermission = await notificationService.requestPermissions();
        if (!hasPermission) {
          console.warn('⚠️ 알림 권한이 거부되었습니다.');
          return;
        }
        console.log('✅ 알림 권한 획득');

        // 푸시 토큰 등록 (로컬 알림만 사용하는 경우 null 반환 가능)
        const token = await notificationService.registerPushToken(user.id);
        if (token) {
          console.log('✅ 푸시 토큰 등록 성공');
        } else {
          console.log('ℹ️ 로컬 알림 모드로 작동합니다 (푸시 토큰 없음)');
        }

        // 포그라운드 알림 핸들러
        notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
          console.log('🔔 알림 수신:', notification.request.content.title);
        });

        // 알림 탭 핸들러
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
          console.log('👆 알림 탭됨:', response.notification.request.content.title);
          const data = response.notification.request.content.data;
          
          // 할일 상세 페이지로 이동 등의 처리
          if (data?.taskId) {
            // 네비게이션 처리 (필요시 구현)
          }
        });

        console.log('✅ 알림 설정 완료');
      } catch (error) {
        console.error('❌ 알림 설정 오류:', error);
        // 알림 설정 실패해도 앱은 계속 작동
      }
    };

    setupNotifications();

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user]);
}
