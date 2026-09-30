import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/useUserStore';
import { authApi } from '@/api/auth';
import { userApi } from '@/api/user';
import { useToast } from '@/hooks/use-toast';
import { format } from "date-fns";

// OTP 검증 로직을 담당하는 훅
export const useVerifyOtpMutation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useUserStore();

  return useMutation({
    // mutationFn: 실제 API 호출을 수행하는 함수
    mutationFn: async ({ phoneNumber, otp, telecom }: { phoneNumber: string; otp: string; telecom?: string }) => {
      // 1. OTP 검증 요청
      const data = await authApi.verifyOtp(phoneNumber, otp);
      
      // 2. 토큰 저장 (다음 API 호출을 위해 필수)
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      return { ...data, telecom }; // 다음 단계로 넘겨줄 데이터 반환
    },

    // 성공 시 실행될 로직
    onSuccess: async (data) => {
      if (data.is_new_user) {
        // [신규] 회원가입 페이지로 이동
        navigate('/register', { state: { telecom: data.telecom } });
      } else {
        // [기존] 내 정보 조회 후 로그인 처리
        try {
          const userData = await userApi.getMe();
          login(data.token, userData); // Store 업데이트
          
          toast({ title: "로그인 성공", description: "환영합니다!" });
          navigate('/app/chat', { replace: true });
        } catch (error) {
           toast({ title: "오류", description: "유저 정보를 불러오는데 실패했습니다.", variant: "destructive" });
        }
      }
    },

    // 실패 시 실행될 로직
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.message || "인증에 실패했습니다.";
      toast({ title: "인증 실패", description: message, variant: "destructive" });
    }
  });
};


// [신규] 회원가입 로직을 담당하는 훅
export const useRegisterMutation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useUserStore();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      telecom: string;
      birthDate: Date;
      gender: string;
      agreedTerms: boolean;
      agreedPrivacy: boolean;
    }) => {
      // 1. 회원가입 요청
      const response = await authApi.register({
        name: data.name,
        telecom: data.telecom,
        birth_date: format(data.birthDate, "yyyy-MM-dd"),
        gender: data.gender,
        agreed_terms: data.agreedTerms,
        agreed_privacy: data.agreedPrivacy,
      });

      // 2. 새 토큰 저장 (임시 토큰 -> 정식 토큰 교체)
      const newAccessToken = response.access_token;
      if (newAccessToken) {
        localStorage.setItem('token', newAccessToken);
      }

      // 3. 내 정보 조회 (새 토큰 사용)
      const userData = await userApi.getMe();
      
      return { token: newAccessToken, user: userData };
    },

    onSuccess: (data) => {
      // 4. 스토어 업데이트 및 이동
      login(data.token, data.user);
      
      toast({ title: "회원가입 성공", description: "CardBenePICK에 오신 것을 환영합니다!" });
      navigate('/link-mydata');
    },

    onError: (error: any) => {
      console.error(error);
      const message = error.response?.data?.detail || error.message || "회원가입에 실패했습니다.";
      toast({ title: "오류", description: message, variant: "destructive" });
    }
  });
};