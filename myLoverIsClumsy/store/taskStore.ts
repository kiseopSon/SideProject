import { create } from 'zustand';
import { Task } from '@/types';

interface TaskState {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  getTodayTasks: () => Task[];
  getTasksByTime: (time: string) => Task[];
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      ),
    })),
  deleteTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
    })),
  getTodayTasks: () => {
    const { tasks } = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return tasks.filter((task) => {
      if (!task.scheduledTime) return false;
      try {
        const taskDate = new Date(task.scheduledTime);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
      } catch (error) {
        console.error('getTodayTasks date parsing error:', error);
        return false;
      }
    });
  },
  getTasksByTime: (time) => {
    return get().tasks.filter((task) => {
      const taskTime = new Date(task.scheduledTime).toTimeString().slice(0, 5);
      return taskTime === time;
    });
  },
}));
