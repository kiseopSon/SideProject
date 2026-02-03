import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useTaskStore } from '@/store/taskStore';
import { taskService } from '@/services/taskService';
import { format, isToday, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { setTasks, getTodayTasks } = useTaskStore();
  const [refreshing, setRefreshing] = useState(false);

  const { data: tasks, refetch } = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: () => taskService.getTasks(user?.id || ''),
    enabled: !!user?.id,
  });

  // React Query v5에서는 onSuccess를 useEffect로 처리
  useEffect(() => {
    if (tasks) {
      console.log('🏠 홈 화면 - 할일 목록 가져오기 성공:', tasks.length || 0, '개');
      if (tasks.length > 0) {
        console.log('📝 첫 번째 할일:', tasks[0]);
      }
      setTasks(tasks);
    }
  }, [tasks, setTasks]);

  // tasks 데이터를 직접 사용 (taskStore 대신)
  const todayTasks = (tasks || []).filter((task) => {
    if (!task.scheduledTime) return false;
    try {
      const taskDate = parseISO(task.scheduledTime);
      return isToday(taskDate);
    } catch (error) {
      console.error('todayTasks date parsing error:', error);
      return false;
    }
  });

  console.log('📅 오늘 할일:', todayTasks.length, '개');
  if (todayTasks.length > 0) {
    console.log('📝 오늘 할일 목록:', todayTasks.map(t => ({ id: t.id, title: t.title, time: t.scheduledTime })));
  }
  
  const upcomingTasks = todayTasks
    .filter((task) => {
      if (!task.scheduledTime) return false;
      try {
        const taskTime = parseISO(task.scheduledTime);
        return !task.completed && taskTime > new Date();
      } catch (error) {
        console.error('upcomingTasks date parsing error:', error);
        return false;
      }
    })
    .sort((a, b) => {
      if (!a.scheduledTime || !b.scheduledTime) return 0;
      return parseISO(a.scheduledTime).getTime() - parseISO(b.scheduledTime).getTime();
    })
    .slice(0, 5);

  console.log('⏰ 다가오는 할일:', upcomingTasks.length, '개');

  const completedToday = todayTasks.filter((task) => task.completed).length;
  const totalToday = todayTasks.length;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>
          안녕하세요, {user?.name}님! 👋
        </Text>
        <Text style={styles.date}>
          {format(new Date(), 'yyyy년 M월 d일 EEEE', { locale: ko })}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{completedToday}/{totalToday}</Text>
          <Text style={styles.statLabel}>오늘 완료</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{upcomingTasks.length}</Text>
          <Text style={styles.statLabel}>남은 할일</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>다가오는 할일</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/tasks/')}>
            <Text style={styles.seeAll}>전체 보기</Text>
          </TouchableOpacity>
        </View>

        {upcomingTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>오늘 남은 할일이 없어요! 🎉</Text>
          </View>
        ) : (
          upcomingTasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskCard}
              onPress={() => router.push(`/(tabs)/tasks/${task.id}`)}
            >
              <View style={styles.taskContent}>
                <Text style={styles.taskTime}>
                  {format(parseISO(task.scheduledTime), 'HH:mm')}
                </Text>
                <Text style={styles.taskTitle}>{task.title}</Text>
                {task.description && (
                  <Text style={styles.taskDescription} numberOfLines={1}>
                    {task.description}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))
        )}
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/(tabs)/tasks/new')}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addButtonText}>새 할일 추가</Text>
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
    backgroundColor: '#FF6B9D',
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B9D',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAll: {
    fontSize: 14,
    color: '#FF6B9D',
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
  taskContent: {
    flex: 1,
  },
  taskTime: {
    fontSize: 12,
    color: '#FF6B9D',
    fontWeight: '600',
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  addButton: {
    backgroundColor: '#FF6B9D',
    borderRadius: 16,
    padding: 18,
    margin: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
