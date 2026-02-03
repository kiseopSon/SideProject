import { supabase } from '@/lib/supabase';
import { Task } from '@/types';
import { convertTaskFromDB } from '@/lib/supabaseHelpers';

export const taskService = {
  // 할일 목록 가져오기
  async getTasks(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('scheduled_time', { ascending: true });

    if (error) {
      console.error('❌ 할일 가져오기 오류:', error);
      throw error;
    }
    
    // 데이터 변환
    return (data || []).map(convertTaskFromDB);
  },

  // 할일 생성
  async createTask(task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    const taskData = {
      user_id: task.userId,
      title: task.title,
      description: task.description || null,
      scheduled_time: task.scheduledTime,
      completed: task.completed ?? false,
      notification_sent: task.notificationSent ?? false,
    };

    console.log('📝 할일 생성 시도:', taskData);

    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single();

    if (error) {
      console.error('❌ 할일 생성 오류:', error);
      console.error('오류 코드:', error.code);
      console.error('오류 메시지:', error.message);
      console.error('오류 상세:', error);
      
      // RLS 오류인 경우
      if (error.message?.includes('row-level security') || 
          error.code === '42501' ||
          error.message?.includes('RLS') ||
          error.message?.includes('policy')) {
        throw new Error(
          '할일 저장 실패: 데이터베이스 권한 문제입니다.\n\n' +
          '해결 방법:\n' +
          '1. Supabase SQL Editor에서 tasks 테이블의 RLS 정책 확인\n' +
          '2. INSERT 정책이 올바르게 설정되었는지 확인'
        );
      }
      
      throw error;
    }
    
    console.log('✅ 할일 생성 성공:', data);
    
    // Task 형식으로 변환
    return convertTaskFromDB(data);
  },

  // 할일 업데이트
  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const updateData: any = {};
    if (updates.completed !== undefined) updateData.completed = updates.completed;
    if (updates.completedAt) updateData.completed_at = updates.completedAt;
    if (updates.title) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.scheduledTime) updateData.scheduled_time = updates.scheduledTime;
    if (updates.notificationSent !== undefined) updateData.notification_sent = updates.notificationSent;

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      scheduledTime: data.scheduled_time,
      completed: data.completed,
      completedAt: data.completed_at,
      createdAt: data.created_at,
      notificationSent: data.notification_sent,
    };
  },

  // 할일 완료 처리
  async completeTask(taskId: string, userId: string): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;

    // 상대방에게 알림 전송
    await this.notifyPartner(userId, {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      scheduledTime: data.scheduled_time,
      completed: data.completed,
      completedAt: data.completed_at,
      createdAt: data.created_at,
      notificationSent: data.notification_sent,
    });

    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      scheduledTime: data.scheduled_time,
      completed: data.completed,
      completedAt: data.completed_at,
      createdAt: data.created_at,
      notificationSent: data.notification_sent,
    };
  },

  // 상대방에게 알림
  async notifyPartner(userId: string, task: Task): Promise<void> {
    // 사용자의 파트너 정보 가져오기
    const { data: user } = await supabase
      .from('users')
      .select('partner_id')
      .eq('id', userId)
      .single();

    if (!user?.partner_id) return;

    // 알림 레코드 생성
    await supabase.from('notifications').insert({
      user_id: user.partner_id,
      task_id: task.id,
      type: 'completion',
      message: `상대방이 "${task.title}"을(를) 완료했습니다!`,
    });
  },

  // 할일 삭제
  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  },

  // 모든 할일 삭제
  async deleteAllTasks(userId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  },
};
