import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HelpScreen() {
  const router = useRouter();

  const faqItems = [
    {
      question: '📝 할일은 어떻게 추가하나요?',
      answer: '홈 화면 또는 할일 탭에서 "+" 버튼을 눌러 새 할일을 추가할 수 있습니다. 제목, 설명, 시간을 입력하고 저장하면 됩니다.',
    },
    {
      question: '🔔 알림은 언제 오나요?',
      answer: '할일의 예정 시간에 알림이 표시됩니다. 상단 알림과 소리로 알려드립니다.',
    },
    {
      question: '💕 커플은 어떻게 연결하나요?',
      answer: '프로필 > 커플 연결하기에서 연결 코드를 생성하거나 입력하여 연결할 수 있습니다.',
    },
    {
      question: '✅ 할일 완료는 어떻게 하나요?',
      answer: '할일 목록에서 할일을 탭하여 상세 화면으로 들어간 후, "완료" 버튼을 누르면 됩니다.',
    },
    {
      question: '👫 파트너에게도 알림이 가나요?',
      answer: '네, 할일 시간과 완료 시 파트너에게도 알림이 전송됩니다.',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>❓ 도움말</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>자주 묻는 질문</Text>
        
        {faqItems.map((item, index) => (
          <View key={index} style={styles.faqItem}>
            <View style={styles.faqQuestion}>
              <Ionicons name="help-circle" size={20} color="#FF6B9D" />
              <Text style={styles.faqQuestionText}>{item.question}</Text>
            </View>
            <Text style={styles.faqAnswer}>{item.answer}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>앱 정보</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>앱 이름</Text>
          <Text style={styles.infoValue}>My Lover is Clumsy</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>버전</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>목적</Text>
          <Text style={styles.infoValue}>
            까먹기 쉬운 사람들을 위한 할일 관리 및 알림 서비스
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>문의하기</Text>
        
        <TouchableOpacity
          style={styles.contactItem}
          onPress={() => {
            Alert.alert('📧 문의', '이메일로 문의해주세요: support@myloverisclumsy.com');
          }}
        >
          <Ionicons name="mail-outline" size={24} color="#333" />
          <Text style={styles.contactText}>이메일 문의</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>
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
  faqItem: {
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    paddingLeft: 28,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
    gap: 16,
  },
  contactText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
});
