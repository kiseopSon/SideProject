import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { TextInput } from 'react-native';

export default function ConnectScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [code, setCode] = useState('');
  const [myCode, setMyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user?.partnerId) {
      router.replace('/(tabs)');
    }
  }, [user]);

  const generateCode = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const newCode = await authService.generateCoupleCode(user.id);
      setMyCode(newCode);
    } catch (error: any) {
      Alert.alert('오류', error.message);
    } finally {
      setGenerating(false);
    }
  };

  const connectWithCode = async () => {
    if (!code.trim()) {
      Alert.alert('오류', '연결 코드를 입력해주세요.');
      return;
    }

    if (!user) return;
    setLoading(true);
    try {
      await authService.connectCouple(user.id, code.toUpperCase());
      Alert.alert('성공', '커플 연결이 완료되었습니다!', [
        { text: '확인', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (error: any) {
      Alert.alert('연결 실패', error.message || '유효하지 않은 코드입니다.');
    } finally {
      setLoading(false);
    }
  };

  const skip = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>커플 연결하기 💕</Text>
      <Text style={styles.subtitle}>
        상대방과 연결하여 서로의 할일을 확인할 수 있어요
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>내 연결 코드 생성</Text>
        {myCode ? (
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{myCode}</Text>
            <Text style={styles.codeHint}>
              이 코드를 상대방에게 공유해주세요
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.button}
            onPress={generateCode}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>코드 생성하기</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>상대방 코드로 연결</Text>
        <TextInput
          style={styles.input}
          placeholder="연결 코드 입력"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          maxLength={6}
        />
        <TouchableOpacity
          style={[styles.button, styles.connectButton]}
          onPress={connectWithCode}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>연결하기</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={skip} style={styles.skipButton}>
        <Text style={styles.skipText}>나중에 하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  codeContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  codeText: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 8,
    color: '#FF6B9D',
    marginBottom: 8,
  },
  codeHint: {
    fontSize: 14,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 4,
    backgroundColor: '#f9f9f9',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#FF6B9D',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  connectButton: {
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 32,
  },
  skipButton: {
    marginTop: 'auto',
    padding: 16,
    alignItems: 'center',
  },
  skipText: {
    color: '#999',
    fontSize: 14,
  },
});
