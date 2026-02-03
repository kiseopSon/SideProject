import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Constants를 안전하게 로드 (모듈 로드 시점 에러 방지)
let Constants: any = null;
try {
  Constants = require('expo-constants');
} catch {
  // Constants 모듈 로드 실패 시 무시
}

// 환경 변수 로드 (여러 방법 시도)
function getEnvVar(key: string, fallback?: string): string | undefined {
  try {
    // 1. process.env 먼저 시도 (가장 일반적인 방법)
    if (process.env[key]) {
      return process.env[key];
    }
    
    // 2. Constants에서 extra를 통해 확인 (app.config.js에서 설정한 경우)
    if (Constants) {
      try {
        // Constants.expoConfig?.extra에서 확인
        if (Constants.expoConfig?.extra?.[key]) {
          return Constants.expoConfig.extra[key];
        }
        // Constants.manifest?.extra에서 확인
        if (Constants.manifest?.extra?.[key]) {
          return Constants.manifest.extra[key];
        }
        // app.config.js의 extra에 명시적으로 추가한 경우 (여러 이름으로 시도)
        if (key === 'EXPO_PUBLIC_SUPABASE_URL') {
          // 다양한 이름으로 시도
          if (Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL) {
            return Constants.expoConfig.extra.EXPO_PUBLIC_SUPABASE_URL;
          }
          if (Constants.expoConfig?.extra?.supabaseUrl) {
            return Constants.expoConfig.extra.supabaseUrl;
          }
        }
        if (key === 'EXPO_PUBLIC_SUPABASE_ANON_KEY') {
          // 다양한 이름으로 시도
          if (Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
            return Constants.expoConfig.extra.EXPO_PUBLIC_SUPABASE_ANON_KEY;
          }
          if (Constants.expoConfig?.extra?.supabaseAnonKey) {
            return Constants.expoConfig.extra.supabaseAnonKey;
          }
        }
      } catch {
        // Constants 접근 실패 시 무시
      }
    }
    
    return fallback;
  } catch {
    return fallback;
  }
}

const supabaseUrl = getEnvVar('EXPO_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY');

// 환경 변수가 없을 경우 크래시 방지를 위한 처리
const finalSupabaseUrl = supabaseUrl || 'https://placeholder.supabase.co';
const finalSupabaseAnonKey = supabaseAnonKey || 'placeholder-key';

// 환경 변수 상태 로깅 (디버깅용)
console.log('🔍 Supabase 환경 변수 상태:');
console.log('  URL 설정됨:', !!supabaseUrl);
console.log('  URL 값:', supabaseUrl ? supabaseUrl.substring(0, 40) + '...' : '없음');
console.log('  Key 설정됨:', !!supabaseAnonKey);
console.log('  Key 값:', supabaseAnonKey ? supabaseAnonKey.substring(0, 30) + '...' : '없음');
console.log('  Placeholder 사용 중:', finalSupabaseUrl.includes('placeholder'));

if (!supabaseUrl || !supabaseAnonKey || finalSupabaseUrl.includes('placeholder')) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  console.error('   EAS Secrets를 확인하고 다시 빌드하세요:');
  console.error('   eas build --platform android --profile preview');
}

// SecureStore를 사용한 커스텀 스토리지 어댑터
// 앱 초기화 전 SecureStore 접근 시 에러 방지
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      // SecureStore가 준비되지 않았을 수 있으므로 안전하게 처리
      if (typeof SecureStore?.getItemAsync !== 'function') {
        return null;
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      // 초기화 전 에러는 조용히 무시
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (typeof SecureStore?.setItemAsync !== 'function') {
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      // 초기화 전 에러는 조용히 무시
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (typeof SecureStore?.deleteItemAsync !== 'function') {
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      // 초기화 전 에러는 조용히 무시
    }
  },
};

// Lazy initialization - 클라이언트를 필요할 때만 생성
let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(finalSupabaseUrl, finalSupabaseAnonKey, {
        auth: {
          storage: ExpoSecureStoreAdapter,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      });
    } catch (error) {
      console.error('Supabase client creation error:', error);
      // 에러가 나도 더미 클라이언트 생성
      try {
        supabaseInstance = createClient('https://placeholder.supabase.co', 'placeholder-key', {
          auth: {
            storage: ExpoSecureStoreAdapter,
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
          },
        });
      } catch {
        // 최후의 수단: 기본 설정으로 생성
        supabaseInstance = createClient('https://placeholder.supabase.co', 'placeholder-key');
      }
    }
  }
  return supabaseInstance;
}

// 환경 변수 상태 확인 함수 (디버깅용)
export function checkSupabaseConfig() {
  return {
    hasUrl: !!supabaseUrl && !supabaseUrl.includes('placeholder'),
    hasKey: !!supabaseAnonKey && !supabaseAnonKey.includes('placeholder'),
    url: supabaseUrl ? (supabaseUrl.substring(0, 30) + '...') : '없음',
    isUsingPlaceholder: finalSupabaseUrl.includes('placeholder'),
  };
}

// Export getter function instead of direct instance
// Proxy를 사용하여 첫 접근 시에만 클라이언트 생성
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    try {
      // placeholder를 사용 중인지 확인하고 경고
      if (finalSupabaseUrl.includes('placeholder')) {
        console.warn('⚠️ Supabase placeholder URL 사용 중! 환경 변수를 확인하세요.');
        console.warn('   URL:', finalSupabaseUrl);
        console.warn('   EAS Secrets에서 EXPO_PUBLIC_SUPABASE_URL을 설정하세요.');
      }
      
      const client = getSupabaseClient();
      const value = (client as any)[prop];
      if (typeof value === 'function') {
        return value.bind(client);
      }
      return value;
    } catch (error) {
      console.error('Supabase proxy access error:', error);
      // 에러가 나도 undefined 반환 (크래시 방지)
      return undefined;
    }
  },
  has(_target, prop) {
    try {
      const client = getSupabaseClient();
      return prop in client;
    } catch {
      return false;
    }
  },
});
