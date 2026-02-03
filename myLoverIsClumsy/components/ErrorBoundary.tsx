import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>⚠️ 오류가 발생했습니다</Text>
            <Text style={styles.message}>
              {this.state.error?.message || '알 수 없는 오류가 발생했습니다'}
            </Text>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>가능한 원인:</Text>
              <Text style={styles.item}>• Supabase 환경 변수가 설정되지 않았습니다</Text>
              <Text style={styles.item}>• 네트워크 연결 문제</Text>
              <Text style={styles.item}>• 앱 버전 불일치</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>해결 방법:</Text>
              <Text style={styles.item}>1. .env 파일이 프로젝트 루트에 있는지 확인</Text>
              <Text style={styles.item}>2. 환경 변수가 올바르게 설정되었는지 확인</Text>
              <Text style={styles.item}>3. 앱을 완전히 종료하고 다시 시작</Text>
              <Text style={styles.item}>4. 서버를 재시작 (Ctrl+C 후 npm start)</Text>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                this.setState({ hasError: false, error: null });
              }}
            >
              <Text style={styles.buttonText}>다시 시도</Text>
            </TouchableOpacity>

            {__DEV__ && this.state.error && (
              <View style={styles.debugSection}>
                <Text style={styles.debugTitle}>디버그 정보:</Text>
                <Text style={styles.debugText}>
                  {this.state.error.stack || this.state.error.toString()}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f44336',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  item: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#FF6B9D',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  debugSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#856404',
    fontFamily: 'monospace',
  },
});
