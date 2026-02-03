export interface User {
  id: string;
  email: string;
  name: string;
  partnerId: string | null;
  createdAt: string;
}

export interface Couple {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  scheduledTime: string; // ISO 8601 format
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  notificationSent: boolean;
}

export interface TaskNotification {
  id: string;
  taskId: string;
  userId: string;
  partnerId: string;
  type: 'reminder' | 'completion';
  sentAt: string;
}
