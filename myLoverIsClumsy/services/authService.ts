import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import { convertUserFromDB } from '@/lib/supabaseHelpers';

export const authService = {
  // 회원가입
  async signUp(email: string, password: string, name: string): Promise<User> {
    // Supabase 연결 확인
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey || 
        supabaseUrl.includes('placeholder') || 
        supabaseKey.includes('placeholder')) {
      throw new Error(
        'Supabase 환경 변수가 설정되지 않았습니다.\n\n' +
        'EAS Secrets에서 EXPO_PUBLIC_SUPABASE_URL과\n' +
        'EXPO_PUBLIC_SUPABASE_ANON_KEY를 "Sensitive" visibility로 설정해주세요.'
      );
    }

    console.log('🔗 Supabase 연결 시도...');
    console.log('   URL:', supabaseUrl.substring(0, 50) + '...');
    console.log('   Key 설정됨:', !!supabaseKey && supabaseKey.length > 50);

    // 1. Supabase Auth에 사용자 생성
    let authData;
    let authError;
    
    try {
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });
      authData = result.data;
      authError = result.error;
    } catch (error: any) {
      console.error('❌ Supabase signUp 네트워크 오류:', error);
      
      // 상세한 에러 정보 수집
      const errorDetails: string[] = [];
      errorDetails.push('=== 에러 상세 정보 ===');
      errorDetails.push(`에러 타입: ${error?.name || 'Unknown'}`);
      errorDetails.push(`에러 메시지: ${error?.message || 'No message'}`);
      errorDetails.push(`에러 코드: ${error?.code || 'No code'}`);
      
      if (error?.status) {
        errorDetails.push(`HTTP 상태: ${error.status}`);
      }
      if (error?.statusText) {
        errorDetails.push(`HTTP 상태 텍스트: ${error.statusText}`);
      }
      
      // 환경 변수 상태
      errorDetails.push('\n=== 환경 변수 상태 ===');
      errorDetails.push(`URL 설정됨: ${supabaseUrl ? '✅' : '❌'}`);
      errorDetails.push(`URL 값: ${supabaseUrl ? supabaseUrl.substring(0, 50) + '...' : '없음'}`);
      errorDetails.push(`Key 설정됨: ${supabaseKey ? '✅' : '❌'}`);
      errorDetails.push(`Key 길이: ${supabaseKey ? supabaseKey.length + '자' : '0자'}`);
      errorDetails.push(`Placeholder 사용: ${supabaseUrl?.includes('placeholder') || supabaseKey?.includes('placeholder') ? '❌ 예' : '✅ 아니오'}`);
      
      // 네트워크 오류 상세 분석
      if (error?.message?.includes('Network request failed') || 
          error?.message?.includes('network') ||
          error?.code === 'ECONNREFUSED' ||
          error?.code === 'ENOTFOUND') {
        errorDetails.push('\n=== 네트워크 오류 분석 ===');
        errorDetails.push('원인: Supabase 서버에 연결할 수 없습니다');
        errorDetails.push('\n가능한 원인:');
        errorDetails.push('1. 인터넷 연결 문제');
        errorDetails.push('2. Supabase URL이 잘못됨');
        errorDetails.push('3. EAS Secrets에 환경 변수가 설정되지 않음');
        errorDetails.push('4. 빌드 시 환경 변수가 포함되지 않음');
        errorDetails.push('\n해결 방법:');
        errorDetails.push('1. EAS Secrets 확인: https://expo.dev/accounts/sonkiseop/projects/my-lover-is-clumsy/variables');
        errorDetails.push('2. Visibility가 "Sensitive" 또는 "Plain text"인지 확인');
        errorDetails.push('3. 다시 빌드: eas build --platform android --profile preview');
      }
      
      // Supabase 클라이언트 상태 확인
      try {
        const { checkSupabaseConfig } = await import('@/lib/supabase');
        const config = checkSupabaseConfig();
        errorDetails.push('\n=== Supabase 클라이언트 상태 ===');
        errorDetails.push(`URL 존재: ${config.hasUrl ? '✅' : '❌'}`);
        errorDetails.push(`Key 존재: ${config.hasKey ? '✅' : '❌'}`);
        errorDetails.push(`Placeholder 사용: ${config.isUsingPlaceholder ? '❌ 예' : '✅ 아니오'}`);
        errorDetails.push(`URL 미리보기: ${config.url}`);
      } catch (configError) {
        errorDetails.push('\n=== Supabase 클라이언트 상태 확인 실패 ===');
        errorDetails.push(`오류: ${configError}`);
      }
      
      // 전체 에러 객체 정보 (개발용)
      if (__DEV__) {
        errorDetails.push('\n=== 전체 에러 객체 ===');
        errorDetails.push(JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      }
      
      throw new Error(errorDetails.join('\n'));
    }

    if (authError) {
      console.error('❌ Supabase auth 오류:', authError);
      throw authError;
    }
    if (!authData?.user) {
      throw new Error('사용자 생성에 실패했습니다.');
    }

    // 2. Database Trigger가 자동으로 프로필을 생성하므로 대기
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. 사용자 프로필 가져오기 (Trigger로 생성됨)
    let userData;
    let retries = 0;
    const maxRetries = 15;

    while (retries < maxRetries) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (data && !error) {
        userData = data;
        break;
      }

      // Trigger가 아직 실행되지 않았으면 대기
      await new Promise(resolve => setTimeout(resolve, 500));
      retries++;
    }

    // 4. Trigger가 작동하지 않으면 수동으로 생성 시도
    if (!userData) {
      console.log('⚠️ Trigger가 작동하지 않음. 수동으로 프로필 생성 시도...');
      
      // 세션을 명시적으로 새로고침
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('현재 세션:', sessionData?.session?.user?.id);
      console.log('생성된 사용자 ID:', authData.user.id);
      
      const { data: createdData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          name,
          partner_id: null,
        })
        .select()
        .single();

      if (userError) {
        console.error('❌ 수동 프로필 생성 실패:', userError);
        console.error('오류 코드:', userError.code);
        console.error('오류 메시지:', userError.message);
        console.error('오류 상세:', userError);
        
        // RLS 오류인 경우
        if (userError.message?.includes('row-level security') || 
            userError.code === '42501' ||
            userError.message?.includes('RLS') ||
            userError.message?.includes('policy')) {
          throw new Error(
            '회원가입 실패: 데이터베이스 권한 문제입니다.\n\n' +
            '해결 방법:\n' +
            '1. Supabase SQL Editor에서 supabase/disable_rls_temporarily.sql 실행\n' +
            '2. 또는 INSERT 정책을 완전히 허용하세요'
          );
        }
        
        throw userError;
      }
      
      userData = createdData;
    }

    return convertUserFromDB(userData);
  },

  // 로그인
  async signIn(email: string, password: string): Promise<User> {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Login failed');

    // 사용자 프로필 가져오기
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) throw userError;
    return convertUserFromDB(userData);
  },

  // 로그아웃
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // 현재 사용자 가져오기
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.warn('getCurrentUser auth error:', authError.message);
        return null;
      }
      if (!user) return null;

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        console.warn('getCurrentUser profile error:', userError?.message);
        return null;
      }
      return convertUserFromDB(userData);
    } catch (error: any) {
      // 네트워크 오류, 잘못된 URL 등 모든 예외 처리
      console.warn('getCurrentUser error:', error?.message || error);
      return null;
    }
  },

  // 커플 연결 코드 생성
  async generateCoupleCode(userId: string): Promise<string> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { error } = await supabase
      .from('couple_codes')
      .insert({
        user_id: userId,
        code,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24시간 후 만료
      });
    
    if (error) throw error;

    return code;
  },

  // 커플 연결
  async connectCouple(userId: string, code: string): Promise<void> {
    // 코드로 상대방 찾기
    const { data: codeData, error: codeError } = await supabase
      .from('couple_codes')
      .select('user_id')
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (codeError || !codeData) throw new Error('Invalid or expired code');

    const partnerId = codeData.user_id;

    // 서로 파트너로 연결
    const { error: updateError1 } = await supabase
      .from('users')
      .update({ partner_id: partnerId })
      .eq('id', userId);

    if (updateError1) throw updateError1;

    const { error: updateError2 } = await supabase
      .from('users')
      .update({ partner_id: userId })
      .eq('id', partnerId);

    if (updateError2) throw updateError2;

    // 커플 레코드 생성
    const { error: coupleError } = await supabase
      .from('couples')
      .insert({
        user1_id: userId,
        user2_id: partnerId,
      });

    if (coupleError) throw coupleError;
  },
};
