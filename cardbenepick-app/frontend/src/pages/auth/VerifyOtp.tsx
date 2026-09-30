import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from '@/hooks/use-toast';
// [변경] API 및 Store 및 Hook 임포트
import { useVerifyOtpMutation } from '@/hooks/useAuthQueries';
import { useUserStore } from '@/store/useUserStore';
import { authApi } from '@/api/auth';
import { userApi } from '@/api/user';

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useUserStore();

  const phoneNumber = location.state?.phoneNumber;
  const telecom = location.state?.telecom;

  useEffect(() => {
    if (!phoneNumber) {
      toast({
        title: "잘못된 접근",
        description: "휴대폰 번호 입력부터 다시 시도해주세요.",
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [phoneNumber, navigate, toast]);

  // 2. React Query 훅 사용
  // mutate: 실행 함수, isPending: 로딩 상태
  const { mutate: verifyOtp, isPending } = useVerifyOtpMutation();
  
  const handleOtpComplete = async (completedOtp: string) => {
    verifyOtp({ phoneNumber, otp: completedOtp, telecom });
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/login')}
          className="mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">인증번호 입력</h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <Card className="shadow-card">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">인증번호 입력</CardTitle>
            <CardDescription>
              {phoneNumber}로 전송된 6자리<br />
              인증번호를 입력해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <InputOTP 
              maxLength={6} 
              value={otp}
              onChange={(value) => setOtp(value)}
              onComplete={handleOtpComplete}
              disabled={isLoading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            {isLoading && (
              <div className="flex items-center mt-4 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                인증 중입니다...
              </div>
            )}

            <Button variant="link" size="sm" className="mt-6 text-sm">
              인증번호를 받지 못했나요?
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyOtp;
  // setIsLoading(true);
  //   try {
  //     const response = await fetch('http://localhost:8000/api/auth/verify-otp', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ phone_number: phoneNumber, otp: completedOtp })
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.json().catch(() => ({ detail: 'OTP 검증에 실패했습니다.' }));
  //       throw new Error(errorData.detail || 'OTP가 올바르지 않습니다.');
  //     }

  //     const data = await response.json();
      
  //     if (data.is_new_user) {
  //       // 신규 유저 -> 회원가입 페이지로 이동 (임시 토큰 전달)
  //       localStorage.setItem('token', data.token); 
  //       navigate('/register', { state: { telecom: telecom } });
  //     } else {
  //       // [수정] 기존 유저 -> 내 정보 조회 후 로그인 처리
  //       const token = data.token;

  //       // 내 정보 가져오기
  //       const userResponse = await fetch('http://localhost:8000/api/users/me', {
  //         headers: { 'Authorization': `Bearer ${token}` }
  //       });

  //       if (userResponse.ok) {
  //           const userData = await userResponse.json();
            
  //           // Store 업데이트 (localStorage 저장 포함)
  //           login(token, userData);
            
  //           toast({ title: "로그인 성공", description: "환영합니다!" });
  //           navigate('/app/chat', { replace: true });
  //       } else {
  //           throw new Error("유저 정보를 불러오는데 실패했습니다.");
  //       }
  //     }

  //   } catch (error: any) {
  //     console.error(error);
  //     toast({ title: "인증 실패", description: error.message || "서버 오류", variant: "destructive" });
  //     setOtp('');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
