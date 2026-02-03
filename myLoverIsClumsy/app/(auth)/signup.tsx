import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';

interface SignupForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignupScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, watch } = useForm<SignupForm>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: SignupForm) => {
    if (data.password !== data.confirmPassword) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      // 환경 변수 상태 확인 및 로그
      const { checkSupabaseConfig } = await import('@/lib/supabase');
      const config = checkSupabaseConfig();
      console.log('🔍 회원가입 시도 전 환경 변수 상태:', config);
      
      // 환경 변수가 없으면 즉시 에러 표시
      if (config.isUsingPlaceholder) {
        const errorMsg = 
          'Supabase 환경 변수가 설정되지 않았습니다.\n\n' +
          `URL 설정됨: ${config.hasUrl}\n` +
          `Key 설정됨: ${config.hasKey}\n` +
          `Placeholder 사용: ${config.isUsingPlaceholder}\n\n` +
          'EAS Secrets를 확인하고 다시 빌드하세요.';
        
        Alert.alert('환경 변수 오류', errorMsg, [
          { text: '확인' },
          {
            text: '로그 보기',
            onPress: () => {
              Alert.alert('로그 확인', 'PowerShell에서 다음 명령어 실행:\n\nadb logcat > app_logs.txt\n\n앱 실행 후 Ctrl+C로 중지하면 app_logs.txt에 로그가 저장됩니다.');
            },
          },
        ]);
        setLoading(false);
        return;
      }
      
      const user = await authService.signUp(data.email, data.password, data.name);
      setUser(user);
      router.replace('/(auth)/connect');
    } catch (error: any) {
      console.error('회원가입 오류:', error);
      
      // services/authService.ts에서 이미 상세한 에러 메시지를 생성했으므로 그대로 사용
      // error.message에는 다음이 포함되어 있음:
      // - 에러 상세 정보 (타입, 메시지, 코드, HTTP 상태)
      // - 환경 변수 상태 (URL, Key, Placeholder 사용 여부)
      // - 네트워크 오류 분석
      // - Supabase 클라이언트 상태
      // - 해결 방법
      const errorMessage = error?.message || error?.toString() || '회원가입에 실패했습니다.';
      
      // 에러 메시지가 이미 상세하게 포함되어 있으므로, 그대로 표시
      // 긴 메시지인 경우 요약 + 상세 보기 버튼 제공
      const isLongMessage = errorMessage.length > 400;
      const shortMessage = isLongMessage 
        ? errorMessage.substring(0, 400) + '\n\n... (더 보려면 "전체 보기" 클릭)'
        : errorMessage;
      
      // 전체 메시지를 보여주는 함수
      const showFullError = () => {
        Alert.alert(
          '회원가입 실패 - 전체 에러 정보',
          errorMessage,
          [
            { text: '닫기', style: 'cancel' },
            {
              text: '해결 방법',
              onPress: () => {
                Alert.alert(
                  '해결 방법',
                  '1. EAS Secrets 확인:\n   https://expo.dev/accounts/sonkiseop/projects/my-lover-is-clumsy/variables\n\n' +
                  '2. Visibility가 "Sensitive" 또는 "Plain text"인지 확인\n\n' +
                  '3. 다시 빌드:\n   eas build --platform android --profile preview\n\n' +
                  '4. 이전 APK 삭제 후 새 APK 설치\n\n' +
                  '5. 다시 테스트'
                );
              },
            },
          ],
          { cancelable: true }
        );
      };
      
      // 첫 번째 Alert: 요약 또는 전체 메시지
      Alert.alert(
        '회원가입 실패',
        shortMessage,
        [
          {
            text: '확인',
            style: 'default',
          },
          isLongMessage
            ? {
                text: '전체 보기',
                onPress: showFullError,
              }
            : null,
          // 에러 메시지에 환경 변수나 네트워크 오류가 포함되어 있으면 해결 방법 버튼 추가
          errorMessage?.includes('환경 변수') || 
          errorMessage?.includes('Placeholder') || 
          errorMessage?.includes('네트워크') ||
          errorMessage?.includes('Network')
            ? {
                text: '해결 방법',
                onPress: () => {
                  Alert.alert(
                    '해결 방법',
                    '에러 메시지에 표시된 내용을 확인하세요.\n\n' +
                    '특히 "Placeholder 사용: ❌ 예"가 보이면:\n' +
                    '→ 환경 변수가 빌드에 포함되지 않았습니다.\n\n' +
                    '해결:\n' +
                    '1. EAS Secrets 확인\n' +
                    '2. Visibility를 "Sensitive"로 설정\n' +
                    '3. 다시 빌드\n' +
                    '4. 새 APK 설치'
                  );
                },
              }
            : null,
        ].filter(Boolean) as any
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>회원가입</Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            rules={{ required: '이름을 입력해주세요' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="이름"
                value={value || ''}
                onChangeText={onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            rules={{ required: '이메일을 입력해주세요' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="이메일"
                value={value || ''}
                onChangeText={onChange}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            rules={{ required: '비밀번호를 입력해주세요', minLength: { value: 6, message: '비밀번호는 최소 6자 이상이어야 합니다' } }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="비밀번호 (6자 이상)"
                value={value || ''}
                onChangeText={onChange}
                secureTextEntry
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            rules={{
              required: '비밀번호 확인을 입력해주세요',
              validate: (value) => value === password || '비밀번호가 일치하지 않습니다',
            }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="비밀번호 확인"
                value={value || ''}
                onChangeText={onChange}
                secureTextEntry
              />
            )}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '가입 중...' : '회원가입'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>이미 계정이 있으신가요? 로그인</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  form: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#FF6B9D',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#FF6B9D',
    fontSize: 14,
  },
});
