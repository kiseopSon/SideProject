const { config } = require('dotenv');

// .env 파일 로드 (로컬 개발용)
try {
  config();
} catch {
  // .env 파일이 없어도 계속 진행
}

// EAS Build에서 환경 변수 확인 (디버깅용)
// 1순위: process.env에서 읽기 (EAS Build가 주입하는 경우)
let supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
let supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// 2순위: .env 파일에서 직접 읽기 (로컬 개발용, EAS Build에서는 작동 안 함)
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === '' || supabaseAnonKey === '') {
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const urlMatch = envContent.match(/EXPO_PUBLIC_SUPABASE_URL\s*=\s*(.+?)(?:\r?\n|$)/);
      const keyMatch = envContent.match(/EXPO_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.+?)(?:\r?\n|$)/);
      if (urlMatch && !supabaseUrl) {
        supabaseUrl = urlMatch[1].trim();
        console.log('📄 .env 파일에서 URL 읽음 (로컬 개발용)');
      }
      if (keyMatch && !supabaseAnonKey) {
        supabaseAnonKey = keyMatch[1].trim();
        console.log('📄 .env 파일에서 Key 읽음 (로컬 개발용)');
      }
    }
  } catch (error) {
    // .env 파일 읽기 실패 시 무시
    console.warn('⚠️ .env 파일 읽기 실패:', error.message);
  }
}

// ⚠️ EAS Build에서는 하드코딩된 값을 사용하지 않음
// EAS Secrets에서 환경 변수가 로드되어야 함

// 환경 변수 상태 로깅 (안전한 방식으로)
try {
  console.log('🔍 app.config.js - 환경 변수 확인:');
  const urlExists = !!process.env.EXPO_PUBLIC_SUPABASE_URL;
  const keyExists = !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const urlValue = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const keyValue = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  
  console.log('  process.env.EXPO_PUBLIC_SUPABASE_URL:', urlExists ? `✅ 있음 (${urlValue.substring(0, Math.min(40, urlValue.length))}...)` : '❌ 없음');
  console.log('  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY:', keyExists ? `✅ 있음 (${keyValue.length}자)` : '❌ 없음');
  console.log('  최종 supabaseUrl:', supabaseUrl ? `✅ 설정됨 (${supabaseUrl.substring(0, Math.min(40, supabaseUrl.length))}...)` : '❌ 없음');
  console.log('  최종 supabaseAnonKey:', supabaseAnonKey ? `✅ 설정됨 (${supabaseAnonKey.length}자)` : '❌ 없음');
  console.log('  모든 EXPO_PUBLIC_ 환경 변수:', Object.keys(process.env).filter(key => key.startsWith('EXPO_PUBLIC_')));
} catch (error) {
  console.warn('⚠️ 환경 변수 확인 중 오류:', error.message);
}

// ⚠️ 테스트용: EAS 환경 변수가 없으면 .env 파일에서 직접 읽기
if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
  console.warn('⚠️ EAS 환경 변수가 없습니다. .env 파일을 확인하거나 EAS Secrets를 설정하세요.');
}

// EAS Build에서는 EXPO_PUBLIC_ 접두사가 있는 환경 변수가 자동으로 주입됨
// 하지만 extra에도 명시적으로 포함시켜서 Constants.expoConfig.extra에서 접근 가능하게 함
module.exports = {
  expo: {
    name: 'My덤벙이',
    slug: 'my-lover-is-clumsy',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    icon: './assets/icon.png',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#FF6B9D',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.myloverisclumsy.app',
    },
    android: {
      package: 'com.myloverisclumsy.app',
      permissions: ['RECEIVE_BOOT_COMPLETED', 'VIBRATE'],
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FF6B9D',
      },
    },
    web: {},
    plugins: [
      [
        'expo-notifications',
        {
          color: '#ffffff',
        },
      ],
    ],
    scheme: 'myloverisclumsy',
    extra: {
      eas: {
        projectId: '9da72273-b741-4089-92c2-2ee35a8f33ed',
      },
      // EAS Build에서 환경 변수를 extra에 명시적으로 포함
      // 빌드 시점에 EAS가 자동으로 process.env에 주입하므로 여기서 읽을 수 있어야 함
      EXPO_PUBLIC_SUPABASE_URL: supabaseUrl || '',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey || '',
      // 추가로 짧은 이름으로도 저장 (호환성)
      supabaseUrl: supabaseUrl || '',
      supabaseAnonKey: supabaseAnonKey || '',
    },
  },
};
