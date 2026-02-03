import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  signOut: async () => {
    try {
      // supabase를 lazy load하여 모듈 로드 시점 에러 방지
      const { supabase } = await import('@/lib/supabase');
      await supabase.auth.signOut();
      set({ user: null });
    } catch (error) {
      console.warn('SignOut error:', error);
      // 에러가 나도 사용자는 로그아웃된 것으로 처리
      set({ user: null });
    }
  },
}));
