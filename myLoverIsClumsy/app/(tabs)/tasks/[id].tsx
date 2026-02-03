import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { taskService } from '@/services/taskService';
import { notificationService } from '@/services/notificationService';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';

export default function TaskDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      const tasks = await taskService.getTasks(user?.id || '');
      return tasks.find((t) => t.id === id);
    },
    enabled: !!id && !!user?.id,
  });

  const completeTaskMutation = useMutation({
    mutationFn: async () => {
      if (!task || !user) throw new Error('Task or user not found');
      
      const updatedTask = await taskService.completeTask(task.id, user.id);
      
      // 상대방에게 완료 알림 전송 (상대방 알림이 켜져있을 때만)
      if (user.partnerId) {
        await notificationService.sendCompletionNotification(updatedTask, user.partnerId);
      }
      
      return updatedTask;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      
      // 상대방 알림이 켜져있는지 확인
      const isEnabled = await notificationService.isPartnerNotificationEnabled();
      if (isEnabled && user?.partnerId) {
        Alert.alert('완료!', '할일을 완료했습니다. 상대방에게 알림이 전송되었어요!');
      } else {
        Alert.alert('완료!', '할일을 완료했습니다.');
      }
    },
    onError: (error: any) => {
      Alert.alert('오류', error.message || '완료 처리에 실패했습니다.');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: () => taskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('오류', error.message || '삭제에 실패했습니다.');
    },
  });

  const handleDelete = () => {
    Alert.alert(
      '할일 삭제',
      '정말 이 할일을 삭제하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => deleteTaskMutation.mutate(),
        },
      ]
    );
  };

  if (isLoading || !task) {
    return (
      <View style={styles.container}>
        <Text>로딩 중...</Text>
      </View>
    );
  }

  const taskDate = parseISO(task.scheduledTime);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color="#f44336" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.taskHeader}>
          <Text style={styles.taskTime}>
            {format(taskDate, 'HH:mm')}
          </Text>
          <Text style={styles.taskDate}>
            {format(taskDate, 'yyyy년 M월 d일 EEEE', { locale: ko })}
          </Text>
        </View>

        <Text style={styles.taskTitle}>{task.title}</Text>

        {task.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>{task.description}</Text>
          </View>
        )}

        <View style={styles.statusContainer}>
          {task.completed ? (
            <View style={styles.completedStatus}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={styles.statusText}>완료됨</Text>
              {task.completedAt && (
                <Text style={styles.completedAt}>
                  {format(parseISO(task.completedAt), 'yyyy년 M월 d일 HH:mm')}에 완료
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.pendingStatus}>
              <Ionicons name="time-outline" size={24} color="#FF6B9D" />
              <Text style={styles.statusText}>대기 중</Text>
            </View>
          )}
        </View>

        {!task.completed && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => completeTaskMutation.mutate()}
            disabled={completeTaskMutation.isPending}
          >
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.completeButtonText}>
              {completeTaskMutation.isPending ? '처리 중...' : '완료하기'}
            </Text>
          </TouchableOpacity>
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
  content: {
    padding: 20,
  },
  taskHeader: {
    marginBottom: 24,
  },
  taskTime: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF6B9D',
    marginBottom: 8,
  },
  taskDate: {
    fontSize: 16,
    color: '#666',
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  descriptionContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B9D',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  statusContainer: {
    marginBottom: 32,
  },
  completedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  completedAt: {
    fontSize: 14,
    color: '#999',
    marginLeft: 'auto',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
