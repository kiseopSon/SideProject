import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { taskService } from '@/services/taskService';
import { notificationService } from '@/services/notificationService';
import { format } from 'date-fns';

interface TaskForm {
  title: string;
  description: string;
  scheduledTime: Date;
}

export default function NewTaskScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { control, handleSubmit, setValue, watch } = useForm<TaskForm>({
    defaultValues: {
      title: '',
      description: '',
      scheduledTime: new Date(),
    },
  });

  const scheduledTime = watch('scheduledTime');

  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskForm) => {
      if (!user) throw new Error('User not found');
      
      const task = await taskService.createTask({
        userId: user.id,
        title: data.title,
        description: data.description || undefined,
        scheduledTime: data.scheduledTime.toISOString(),
        completed: false,
        notificationSent: false,
      });

      // 알림 스케줄링
      try {
        await notificationService.scheduleTaskNotification(
          task,
          user.partnerId || undefined
        );
        console.log('✅ 알림 스케줄링 완료');
      } catch (error) {
        console.error('❌ 알림 스케줄링 오류:', error);
        // 알림 실패해도 할일은 저장됨
      }

      return task;
    },
    onSuccess: () => {
      console.log('✅ 할일 생성 성공, 쿼리 무효화 중...');
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
      queryClient.refetchQueries({ queryKey: ['tasks', user?.id] });
      // 바로 화면 전환
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('오류', error.message || '할일 추가에 실패했습니다.');
    },
  });

  const onSubmit = (data: TaskForm) => {
    if (!data.title.trim()) {
      Alert.alert('오류', '할일 제목을 입력해주세요.');
      return;
    }
    createTaskMutation.mutate(data);
  };

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      const newDate = new Date(date);
      newDate.setHours(scheduledTime.getHours(), scheduledTime.getMinutes());
      setSelectedDate(newDate);
      setValue('scheduledTime', newDate);
    }
  };

  const onTimeChange = (event: any, date?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (date) {
      const newDate = new Date(selectedDate);
      newDate.setHours(date.getHours(), date.getMinutes());
      setSelectedDate(newDate);
      setValue('scheduledTime', newDate);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelButton}>취소</Text>
        </TouchableOpacity>
        <Text style={styles.title}>새 할일</Text>
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={createTaskMutation.isPending}
        >
          <Text style={[styles.saveButton, createTaskMutation.isPending && styles.saveButtonDisabled]}>
            저장
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>할일 제목 *</Text>
        <Controller
          control={control}
          name="title"
          rules={{ required: '제목을 입력해주세요' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="예: 약 먹기, 물 마시기"
                value={value || ''}
                onChangeText={onChange}
              />
            )}
        />

        <Text style={styles.label}>설명 (선택)</Text>
        <Controller
          control={control}
          name="description"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="상세 설명을 입력하세요"
                value={value || ''}
                onChangeText={onChange}
                multiline
                numberOfLines={4}
              />
            )}
        />

        <Text style={styles.label}>시간 *</Text>
        <View style={styles.timeContainer}>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.timeButtonText}>
              {format(scheduledTime, 'yyyy년 M월 d일')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.timeButtonText}>
              {format(scheduledTime, 'HH:mm')}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && Platform.OS !== 'web' && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        {showTimePicker && Platform.OS !== 'web' && (
          <DateTimePicker
            value={selectedDate}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )}

        {/* 웹에서는 HTML input 사용 */}
        {Platform.OS === 'web' && (
          <>
            {showDatePicker && (
              <input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                min={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => {
                  if (e.target.value) {
                    const newDate = new Date(e.target.value);
                    newDate.setHours(scheduledTime.getHours(), scheduledTime.getMinutes());
                    setSelectedDate(newDate);
                    setValue('scheduledTime', newDate);
                    setShowDatePicker(false);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '16px',
                  marginTop: '8px',
                }}
              />
            )}
            {showTimePicker && (
              <input
                type="time"
                value={format(selectedDate, 'HH:mm')}
                onChange={(e) => {
                  if (e.target.value) {
                    const [hours, minutes] = e.target.value.split(':');
                    const newDate = new Date(selectedDate);
                    newDate.setHours(parseInt(hours), parseInt(minutes));
                    setSelectedDate(newDate);
                    setValue('scheduledTime', newDate);
                    setShowTimePicker(false);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '16px',
                  marginTop: '8px',
                }}
              />
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FF6B9D',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  cancelButton: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  saveButton: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  timeButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#FF6B9D',
    borderRadius: 16,
    padding: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timeButtonText: {
    fontSize: 16,
    color: '#FF6B9D',
    fontWeight: '600',
  },
});
