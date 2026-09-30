// frontend/src/components/SessionMonitor.tsx

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/useUserStore';
import { getTimeLeft } from '@/utils/auth';
import { useToast } from '@/hooks/use-toast';
import { AUTH_ERROR_EVENT } from '@/lib/api'; // [추가]

const SessionMonitor = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token, logout } = useUserStore();
  const hasWarnedRef = useRef(false);

  // 1. [기존] 시간 기반 체크
  useEffect(() => {
    if (!token) return;
    const checkSession = () => {
      const timeLeft = getTimeLeft(token);
      if (timeLeft <= 0) {
        handleLogout();
        return;
      }
      if (timeLeft < 60000 && !hasWarnedRef.current) {
        hasWarnedRef.current = true;
        toast({ title: "로그아웃 예정", description: "1분 뒤 로그아웃됩니다.", variant: "destructive" });
      }
    };
    const intervalId = setInterval(checkSession, 1000);
    return () => clearInterval(intervalId);
  }, [token]);

  // 2. [신규] API 401 에러 감지 리스너
  useEffect(() => {
    const onAuthError = () => {
        handleLogout("세션 만료", "인증 정보가 유효하지 않아 로그아웃되었습니다.");
    };
    window.addEventListener(AUTH_ERROR_EVENT, onAuthError);
    return () => window.removeEventListener(AUTH_ERROR_EVENT, onAuthError);
  }, []);

  const handleLogout = (title = "세션 만료", desc = "다시 로그인해주세요.") => {
    logout();
    navigate('/login');
    // 중복 토스트 방지
    if (!document.querySelector('.toast-auth-error')) {
        toast({ title, description: desc, variant: "destructive", className: "toast-auth-error" });
    }
  };

  useEffect(() => { hasWarnedRef.current = false; }, [token]);

  return null;
};

export default SessionMonitor;