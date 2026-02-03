import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from '@/services/notificationService';
import { useAuthStore } from '@/store/authStore';

const PARTNER_NOTIFICATION_KEY = 'partner_notification_enabled';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [partnerNotificationEnabled, setPartnerNotificationEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkNotificationPermission();
    loadPartnerNotificationSetting();
  }, []);

  const loadPartnerNotificationSetting = async () => {
    try {
      const value = await AsyncStorage.getItem(PARTNER_NOTIFICATION_KEY);
      if (value !== null) {
        setPartnerNotificationEnabled(JSON.parse(value));
      }
    } catch (error) {
      console.error('상대방 알림 설정 로드 실패:', error);
    }
  };

  const savePartnerNotificationSetting = async (value: boolean) => {
    try {
      await AsyncStorage.setItem(PARTNER_NOTIFICATION_KEY, JSON.stringify(value));
      setPartnerNotificationEnabled(value);
    } catch (error) {
      console.error('상대방 알림 설정 저장 실패:', error);
    }
  };

  const checkNotificationPermission = async () => {
    // 웹에서는 알림이 지원되지 않음
    if (Platform.OS === 'web') {
      setNotificationsEnabled(false);
      setLoading(false);
      return;
    }

    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationsEnabled(status === 'granted');
    } catch (error) {
      console.error('알림 권한 확인 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    // 웹에서는 알림이 지원되지 않음
    if (Platform.OS === 'web') {
      setNotificationsEnabled(value);
      if (value) {
        Alert.alert('안내', '웹 환경에서는 알림이 지원되지 않습니다. 모바일 앱에서 알림을 사용해주세요.');
      }
      return;
    }

    if (value) {
      // 알림 권한 요청
      const hasPermission = await notificationService.requestPermissions();
      if (hasPermission) {
        setNotificationsEnabled(true);
        Alert.alert('성공', '알림이 활성화되었습니다.');
      } else {
        Alert.alert(
          '알림 권한 필요',
          '알림을 받으려면 설정에서 알림 권한을 허용해주세요.',
          [
            { text: '취소', style: 'cancel' },
            {
              text: '설정 열기',
              onPress: () => {
                // 설정 앱 열기 (플랫폼별로 다를 수 있음)
                Alert.alert('안내', '설정 > 앱 > 알림에서 권한을 허용해주세요.');
              },
            },
          ]
        );
      }
    } else {
      setNotificationsEnabled(false);
      Alert.alert('알림 비활성화', '알림이 비활성화되었습니다.');
    }
  };

  const handleTestNotification = async () => {
    // 웹에서는 알림이 지원되지 않음
    if (Platform.OS === 'web') {
      Alert.alert('안내', '웹 환경에서는 알림이 지원되지 않습니다. 모바일 앱에서 테스트해주세요.');
      return;
    }

    if (!notificationsEnabled) {
      Alert.alert('알림 비활성화', '먼저 알림을 활성화해주세요.');
      return;
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '테스트 알림 🔔',
          body: '알림이 정상적으로 작동합니다!',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          vibrate: [0, 250, 250, 250],
        },
        trigger: {
          seconds: 2,
        },
      });
      console.log('✅ 테스트 알림 스케줄링 성공:', notificationId);
      Alert.alert('성공', '2초 후 테스트 알림이 표시됩니다.');
    } catch (error: any) {
      console.error('❌ 테스트 알림 실패:', error);
      Alert.alert('오류', `테스트 알림 전송에 실패했습니다: ${error.message}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>🔔 알림 설정</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.section}>
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="notifications" size={24} color="#FF6B9D" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>알림 받기</Text>
              <Text style={styles.settingDescription}>
                할일 시간 알림을 받습니다
              </Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: '#ddd', true: '#FF6B9D' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="heart" size={24} color="#FF6B9D" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>상대방 알림</Text>
              <Text style={styles.settingDescription}>
                상대방의 할일 시간과 완료 알림을 받습니다
              </Text>
            </View>
          </View>
          <Switch
            value={partnerNotificationEnabled}
            onValueChange={savePartnerNotificationSetting}
            trackColor={{ false: '#ddd', true: '#FF6B9D' }}
            thumbColor="#fff"
            disabled={!user?.partnerId || !notificationsEnabled}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>알림 종류</Text>
        
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={20} color="#666" />
          <Text style={styles.infoText}>⏰ 할일 시간 알림</Text>
        </View>
        {partnerNotificationEnabled && (
          <View style={styles.infoItem}>
            <Ionicons name="heart-outline" size={20} color="#666" />
            <Text style={styles.infoText}>💕 상대방 알림</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.testButton,
          (Platform.OS === 'web' || !notificationsEnabled) && styles.testButtonDisabled,
        ]}
        onPress={handleTestNotification}
        disabled={Platform.OS === 'web' || !notificationsEnabled}
      >
        <Ionicons 
          name="notifications-outline" 
          size={20} 
          color={Platform.OS === 'web' || !notificationsEnabled ? '#999' : '#fff'} 
        />
        <Text
          style={[
            styles.testButtonText,
            (Platform.OS === 'web' || !notificationsEnabled) && styles.testButtonTextDisabled,
          ]}
        >
          테스트 알림 보내기
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    paddingHorizontal: 20,
    paddingVertical: 12,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingHorizontal: 20,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    padding: 16,
    backgroundColor: '#FF6B9D',
    borderRadius: 12,
    gap: 8,
  },
  testButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  testButtonTextDisabled: {
    color: '#999',
  },
});
