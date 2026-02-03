import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { Task } from '@/types';

const PARTNER_NOTIFICATION_KEY = 'partner_notification_enabled';

// 알림 핸들러 설정 (포그라운드에서도 알림 표시)
// 웹에서는 알림이 지원되지 않으므로 모바일에서만 설정
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      console.log('📱 알림 핸들러 호출:', notification.request.content.title);
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      };
    },
  });
}

// Android 알림 채널 설정 (비동기로 초기화)
const initializeAndroidChannel = async () => {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: '기본 알림',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
        showBadge: true,
      });
      console.log('✅ Android 알림 채널 설정 완료');
    } catch (error) {
      console.error('❌ Android 알림 채널 설정 실패:', error);
    }
  }
};

// 초기화 실행 (웹이 아닐 때만)
if (Platform.OS !== 'web') {
  initializeAndroidChannel();
}

export const notificationService = {
  // 상대방 알림 설정 확인
  async isPartnerNotificationEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(PARTNER_NOTIFICATION_KEY);
      return value !== null ? JSON.parse(value) : false;
    } catch (error) {
      console.error('상대방 알림 설정 확인 실패:', error);
      return false;
    }
  },

  // 알림 권한 요청
  async requestPermissions(): Promise<boolean> {
    // 웹에서는 알림이 지원되지 않음
    if (Platform.OS === 'web') {
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  },

  // 푸시 토큰 등록 (로컬 알림만 사용하는 경우 선택적)
  async registerPushToken(userId: string): Promise<string | null> {
    // 웹에서는 알림이 지원되지 않음
    if (Platform.OS === 'web') {
      return null;
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.log('⚠️ 알림 권한이 없어 푸시 토큰을 등록할 수 없습니다.');
      return null;
    }

    // Expo Push Token은 프로젝트 ID가 필요하므로, 로컬 알림만 사용하는 경우 생략
    // 로컬 알림은 프로젝트 ID 없이도 작동합니다
    try {
      // 프로젝트 ID가 있으면 푸시 토큰 등록 시도
      const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
      if (projectId) {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        });

        // Supabase에 토큰 저장
        await supabase
          .from('user_push_tokens')
          .upsert({
            user_id: userId,
            token: token.data,
            platform: Platform.OS,
          });

        return token.data;
      } else {
        console.log('ℹ️ 프로젝트 ID가 없어 로컬 알림만 사용합니다. (정상 동작)');
        return null;
      }
    } catch (error: any) {
      // 프로젝트 ID가 없어서 실패하는 것은 정상입니다 (로컬 알림 사용)
      if (error.message?.includes('projectId') || error.message?.includes('Invalid uuid')) {
        console.log('ℹ️ 로컬 알림 모드: 푸시 토큰 없이 로컬 알림만 사용합니다.');
      } else {
        console.warn('⚠️ 푸시 토큰 등록 실패 (로컬 알림은 계속 작동):', error.message);
      }
      // 로컬 알림은 프로젝트 ID 없이도 작동하므로 에러를 무시
      return null;
    }
  },

  // 할일 알림 스케줄링
  async scheduleTaskNotification(task: Task, partnerId?: string): Promise<void> {
    // 웹에서는 알림이 지원되지 않음
    if (Platform.OS === 'web') {
      console.log('ℹ️ 웹 환경에서는 알림이 지원되지 않습니다.');
      return;
    }

    // 권한 확인
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.warn('⚠️ 알림 권한이 없습니다. 알림을 스케줄링할 수 없습니다.');
      return;
    }

    const trigger = new Date(task.scheduledTime);
    const now = new Date();

    // 이미 지난 시간이면 스케줄링하지 않음
    if (trigger <= now) {
      console.log('⏰ 알림 시간이 이미 지났습니다:', trigger);
      return;
    }

    console.log('📅 알림 스케줄링:', {
      taskId: task.id,
      title: task.title,
      scheduledTime: task.scheduledTime,
      triggerTime: trigger.toISOString(),
      secondsUntilTrigger: Math.floor((trigger.getTime() - now.getTime()) / 1000),
    });

    // 할일 주인에게 알림
    try {
      // Android 채널 확인 및 설정
      if (Platform.OS === 'android') {
        await initializeAndroidChannel();
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '할일 시간이에요! ⏰',
          body: task.title,
          data: { taskId: task.id, type: 'task_reminder' },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          vibrate: Platform.OS === 'android' ? [0, 250, 250, 250] : undefined,
        },
        trigger: {
          date: trigger,
        },
      });

      console.log('✅ 알림 스케줄링 성공:', notificationId);
      console.log('⏰ 알림 예정 시간:', trigger.toLocaleString('ko-KR'));
    } catch (error) {
      console.error('❌ 알림 스케줄링 실패:', error);
    }

    // 상대방에게도 알림 (상대방 알림이 켜져있고 파트너가 있으면)
    if (partnerId) {
      const isEnabled = await this.isPartnerNotificationEnabled();
      if (isEnabled) {
        const { data: partnerToken } = await supabase
          .from('user_push_tokens')
          .select('token')
          .eq('user_id', partnerId)
          .single();

        if (partnerToken) {
          // Expo Push Notification API를 통해 상대방에게 알림 전송
          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: partnerToken.token,
              title: '상대방의 할일 시간이에요! 💕',
              body: `${task.title} 시간입니다`,
              data: { taskId: task.id, type: 'partner_task_reminder' },
              sound: 'default',
            }),
          });
        }
      }
    }
  },

  // 완료 알림 전송 (상대방 알림이 켜져있을 때만 상대방에게 전송)
  async sendCompletionNotification(task: Task, partnerId: string): Promise<void> {
    // 웹에서는 알림이 지원되지 않음
    if (Platform.OS === 'web') {
      console.log('ℹ️ 웹 환경에서는 알림이 지원되지 않습니다.');
      return;
    }

    // 상대방 알림이 켜져있는지 확인
    const isEnabled = await this.isPartnerNotificationEnabled();
    if (!isEnabled) {
      console.log('ℹ️ 상대방 알림이 비활성화되어 있어 완료 알림을 전송하지 않습니다.');
      return;
    }

    const { data: partnerToken } = await supabase
      .from('user_push_tokens')
      .select('token')
      .eq('user_id', partnerId)
      .single();

    if (partnerToken) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: partnerToken.token,
          title: '할일 완료 알림 ✅',
          body: `상대방이 "${task.title}"을(를) 완료했습니다!`,
          data: { taskId: task.id, type: 'task_completion' },
          sound: 'default',
        }),
      });
    }
  },

  // 예약된 알림 취소
  async cancelScheduledNotification(notificationId: string): Promise<void> {
    // 웹에서는 알림이 지원되지 않음
    if (Platform.OS === 'web') {
      return;
    }
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  },
};
