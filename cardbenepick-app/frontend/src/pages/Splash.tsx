import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// [추가] Store 임포트
import { useUserStore } from '@/store/useUserStore';

const Splash = () => {
  const navigate = useNavigate();
  // [추가] Hook
  const { login, logout } = useUserStore();

  useEffect(() => {
    const initApp = async () => {
      // 1. 로컬 스토리지에서 토큰 확인 (useUserStore의 persist가 로드되기 전일 수도 있으므로 직접 조회)
      // (하지만 persist는 동기적으로 로드되므로 useUserStore().token을 써도 무방하나, 안전하게 localStorage 사용)
      const token = localStorage.getItem('token');

      if (token) {
        try {
          // 2. 토큰이 있으면 내 정보 조회 (유효성 검증 겸)
          const response = await fetch('http://localhost:8000/api/users/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            const userData = await response.json();
            // 3. 정보가 유효하면 스토어 갱신 후 메인으로
            login(token, userData); 
            navigate('/app/chat', { replace: true });
            return;
          } 
        } catch (e) {
          console.error("Auto login failed", e);
        }
      }
      
      // 3. 토큰이 없거나 유효하지 않으면(401 등) 로그인 페이지로
      logout(); // 잔여 데이터 클리어
      navigate('/login');
    };

    // 로고를 좀 보여주기 위해 2초 딜레이
    const timer = setTimeout(initApp, 2000);
    return () => clearTimeout(timer);
  }, [navigate, login, logout]);

  return (
    <div 
      className="flex flex-col items-center justify-center h-screen"
      style={{ backgroundColor: '#E6F0FF' }}
    >
      <div className="flex flex-col items-center gap-12 animate-pulse">
        <img 
          src="/images/imageLogo.png" 
          alt="메인 이미지" 
          className="w-[214px] h-[214px] object-contain"
        />
        <img 
          src="/images/nameLogo.png" 
          alt="서비스 이름 로고" 
          className="w-[214px] h-[214px] object-contain"
        />
      </div>
    </div>
  );
};

export default Splash;