import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useTaskStore } from '@/store/taskStore';
import { taskService } from '@/services/taskService';
import { format, parseISO, isToday, isPast } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '@/types';

export default function TasksScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { setTasks, getTodayTasks } = useTaskStore();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');

  const { data: tasks, refetch, isLoading } = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: () => taskService.getTasks(user?.id || ''),
    enabled: !!user?.id,
  });

  // React Query v5에서는 onSuccess를 useEffect로 처리
  useEffect(() => {
    if (tasks) {
      console.log('📋 할일 목록 가져오기 성공:', tasks.length || 0, '개');
      setTasks(tasks);
    }
  }, [tasks, setTasks]);

  // 디버깅: tasks 데이터 확인
  console.log('🔍 현재 tasks 데이터:', tasks?.length || 0, '개');
  if (tasks && tasks.length > 0) {
    console.log('📝 첫 번째 할일:', tasks[0]);
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const deleteAllMutation = useMutation({
    mutationFn: () => taskService.deleteAllTasks(user?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
      setTasks([]);
      Alert.alert('완료', '모든 할일이 삭제되었습니다.');
    },
    onError: (error: any) => {
      Alert.alert('오류', error.message || '삭제에 실패했습니다.');
    },
  });

  const handleDeleteAll = () => {
    const taskCount = filteredTasks.length;
    if (taskCount === 0) {
      Alert.alert('알림', '삭제할 할일이 없습니다.');
      return;
    }

    Alert.alert(
      '전체 삭제',
      `정말 모든 할일(${taskCount}개)을 삭제하시겠어요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => deleteAllMutation.mutate(),
        },
      ]
    );
  };

  const filteredTasks = (tasks || []).filter((task) => {
    if (!task.scheduledTime) {
      console.warn('⚠️ scheduledTime이 없는 할일:', task);
      return false;
    }
    try {
      const taskDate = parseISO(task.scheduledTime);
      switch (filter) {
        case 'today':
          return isToday(taskDate);
        case 'upcoming':
          return !task.completed && taskDate > new Date();
        case 'completed':
          return task.completed;
        default:
          return true;
      }
    } catch (error) {
      console.error('Date parsing error:', error, 'task:', task);
      return false;
    }
  }).sort((a, b) => {
    if (!a.scheduledTime || !b.scheduledTime) return 0;
    return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
  });

  console.log('🔍 필터링된 할일:', filteredTasks.length, '개 (필터:', filter, ')');

  const renderTask = ({ item }: { item: Task }) => {
    if (!item.scheduledTime) {
      return null;
    }
    
    let taskDate: Date;
    try {
      taskDate = parseISO(item.scheduledTime);
    } catch (error) {
      console.error('Date parsing error:', error);
      return null;
    }
    
    const isOverdue = !item.completed && isPast(taskDate) && !isToday(taskDate);

    return (
      <TouchableOpacity
        style={[styles.taskCard, item.completed && styles.taskCardCompleted, isOverdue && styles.taskCardOverdue]}
        onPress={() => router.push(`/(tabs)/tasks/${item.id}`)}
      >
        <View style={styles.taskContent}>
          <View style={styles.taskHeader}>
            <Text style={styles.taskTime}>
              {format(taskDate, 'HH:mm')}
            </Text>
            {item.completed && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.completedText}>완료</Text>
              </View>
            )}
            {isOverdue && (
              <View style={styles.overdueBadge}>
                <Text style={styles.overdueText}>지연</Text>
              </View>
            )}
          </View>
          <Text style={[styles.taskTitle, item.completed && styles.taskTitleCompleted]}>
            {item.title}
          </Text>
          {item.description && (
            <Text style={styles.taskDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <Text style={styles.taskDate}>
            {format(taskDate, 'yyyy년 M월 d일 EEEE', { locale: ko })}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>할일 목록</Text>
        <View style={styles.headerButtons}>
          {filteredTasks.length > 0 && (
            <TouchableOpacity
              style={styles.deleteAllButton}
              onPress={handleDeleteAll}
              disabled={deleteAllMutation.isPending}
            >
              <Ionicons name="trash-outline" size={20} color="#f44336" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/(tabs)/tasks/new')}
          >
            <Ionicons name="add" size={24} color="#FF6B9D" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterContainer}>
        {(['all', 'today', 'upcoming', 'completed'] as const).map((filterOption) => (
          <TouchableOpacity
            key={filterOption}
            style={[
              styles.filterButton,
              filter === filterOption && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(filterOption)}
          >
            <Text
              style={[
                styles.filterText,
                filter === filterOption && styles.filterTextActive,
              ]}
            >
              {filterOption === 'all' ? '전체' :
               filterOption === 'today' ? '오늘' :
               filterOption === 'upcoming' ? '예정' : '완료'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="list-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>할일이 없어요</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#FF6B9D',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteAllButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterButtonActive: {
    backgroundColor: '#FF6B9D',
    borderColor: '#FF6B9D',
    shadowColor: '#FF6B9D',
    shadowOpacity: 0.3,
    elevation: 3,
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B9D',
  },
  taskCardCompleted: {
    opacity: 0.6,
  },
  taskCardOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  taskTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B9D',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  completedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  overdueBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  overdueText: {
    fontSize: 12,
    color: '#f44336',
    fontWeight: '600',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  taskDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});
