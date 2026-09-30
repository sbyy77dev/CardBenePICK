import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Phone, Smartphone, Loader2 } from 'lucide-react'; // [수정] Smartphone, Loader2 추가
import { useToast } from '@/hooks/use-toast';
// [추가] Select 컴포넌트 임포트
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// API 모듈 임포트
import { authApi } from '@/api/auth';

// [추가] 통신사 목록
const telecomOptions = [
  { value: "SKT", label: "SKT" },
  { value: "KT", label: "KT" },
  { value: "LGU+", label: "LG U+" },
  { value: "SKT_MVNO", label: "SKT 알뜰폰" },
  { value: "KT_MVNO", label: "KT 알뜰폰" },
  { value: "LGU+_MVNO", label: "LG U+ 알뜰폰" },
];

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [telecom, setTelecom] = useState(''); // [추가] 통신사 state
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!/^(010[0-9]{8})$/.test(phone)) {
      toast({
        title: "입력 오류",
        description: "올바른 휴대폰 번호(01012345678)를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    // [추가] 통신사 선택 유효성 검사
    if (!telecom) {
      toast({
        title: "입력 오류",
        description: "통신사를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // // (참고: 현재 백엔드 /send-otp API는 telecom을 받지 않지만,
      // // 프론트엔드 로직상 필요하므로 다음 페이지로만 넘깁니다.)
      // const response = await f e t c h('http://localhost:8000/api/auth/send-otp', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ phone_number: phone }),
      // });

      // if (!response.ok) {
      //   const errorData = await response.json().catch(() => ({ detail: 'OTP 발송에 실패했습니다.' }));
      //   throw new Error(errorData.detail || 'OTP 발송에 실패했습니다.');
      // }

      await authApi.sendOtp(phone);
      toast({
        title: "인증번호 발송",
        description: `${phone}으로 인증번호가 발송되었습니다. (백엔드 콘솔 확인)`,
      });

      // [수정] VerifyOtp 페이지로 'phone'과 'telecom'을 함께 전달
      navigate('/verify-otp', { state: { phoneNumber: phone, telecom: telecom } });

    } catch (error: any) {
      console.error(error);
      toast({ title: "오류", description: error.message || "서버와 통신할 수 없습니다.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryout = () => {
    navigate('/survey');
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/')}
          className="mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">시작하기</h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <Card className="shadow-card">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">휴대폰 번호 인증</CardTitle>
            <CardDescription>
              서비스 이용을 위해 본인인증을 진행합니다.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 통신사 선택 (순서 변경) */}
              <div className="space-y-2">
                <Label htmlFor="telecom">통신사</Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Select onValueChange={setTelecom} value={telecom}>
                    <SelectTrigger className="pl-10 h-12" id="telecom">
                      <SelectValue placeholder="통신사를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {telecomOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 휴대폰 번호 입력 */}
              <div className="space-y-2">
                <Label htmlFor="phone">휴대폰 번호</Label>
                <div className="relative">
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="'-' 없이 01012345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    maxLength={11}
                    className="h-12 pr-10"
                  />
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full btn-gradient h-11"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "인증번호 발송"}
              </Button>

              {/* 체험하기 버튼 */}
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  또는
                </span>
              </div>
              <Button 
                type="button" 
                variant="outline"
                className="w-full h-11"
                onClick={handleTryout}
              >
                회원가입 없이 체험하기
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                이미 계정이 있으신가요?
              </p>
              <p className="text-xs text-muted-foreground">
                휴대폰 번호로 로그인 및 회원가입이 진행됩니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;