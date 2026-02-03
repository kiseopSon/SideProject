// Supabase snake_case와 TypeScript camelCase 간 변환 헬퍼

export const convertUserFromDB = (dbUser: any) => ({
  id: dbUser.id,
  email: dbUser.email,
  name: dbUser.name,
  partnerId: dbUser.partner_id,
  createdAt: dbUser.created_at,
});

export const convertTaskFromDB = (dbTask: any) => ({
  id: dbTask.id,
  userId: dbTask.user_id,
  title: dbTask.title,
  description: dbTask.description,
  scheduledTime: dbTask.scheduled_time,
  completed: dbTask.completed,
  completedAt: dbTask.completed_at,
  createdAt: dbTask.created_at,
  notificationSent: dbTask.notification_sent,
});

export const convertTaskToDB = (task: any) => ({
  user_id: task.userId,
  title: task.title,
  description: task.description,
  scheduled_time: task.scheduledTime,
  completed: task.completed ?? false,
  completed_at: task.completedAt,
  notification_sent: task.notificationSent ?? false,
});
