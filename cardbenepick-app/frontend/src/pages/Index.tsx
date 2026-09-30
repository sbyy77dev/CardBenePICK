import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CreditCard, 
  FileText, 
  List, 
  PieChart, 
  Bell, 
  Settings, 
  Home, 
  Megaphone,
  Wallet,
  ChevronRight,
  Search,
  User,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [backendMessage, setBackendMessage] = useState("연결 대기 중...");

  // 백엔드 연결 체크
  useEffect(() => {
    fetch('http://localhost:8000/') 
      .then(res => res.json())
      .then(data => setBackendMessage("서비스 정상 동작 중"))
      .catch(err => setBackendMessage("서버 연결 확인 필요"));
  }, []);

  return (
    // 전체 배경: 아주 연한 회색 (아이보리 톤 살짝 섞음)
    <div className="app-container flex flex-col min-h-screen font-sans" style={{ backgroundColor: '#F9FAFB' }}>
      
      {/* 1. 상단 헤더 (흰색 배경 고정) */}
      <div className="px-6 pt-6 pb-8 rounded-b-[2rem] shadow-sm z-10" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-5">
            <Home className="w-6 h-6" color="#111827" strokeWidth={2.5} />
            <Megaphone className="w-6 h-6 hover:text-gray-900 transition-colors" color="#9CA3AF" />
            <Bell className="w-6 h-6 hover:text-gray-900 transition-colors" color="#9CA3AF" />
          </div>
          <Settings className="w-6 h-6 hover:text-gray-900 transition-colors" color="#9CA3AF" />
        </div>

        <div className="space-y-2 mb-8 animate-fade-in">
          <h1 className="text-[26px] font-bold leading-tight" style={{ color: '#111827' }}>
            김카드님,<br />
            <span className="font-normal text-xl" style={{ color: '#6B7280' }}>알록달록 혜택을 모았어요!</span>
          </h1>
        </div>

        <div className="rounded-full px-5 py-3.5 text-sm flex items-center cursor-pointer hover:bg-gray-200 transition-colors" style={{ backgroundColor: '#F3F4F6' }}>
          <Search className="w-5 h-5 mr-3" color="#6B7280" />
          <span className="flex-1 font-medium" style={{ color: '#9CA3AF' }}>검색어를 입력하세요</span>
        </div>
      </div>

      {/* 2. ★ 알록달록 4색 메뉴 (아이콘 색상 강제 지정) ★ */}
      <div className="px-6 -mt-6">
        <div className="grid grid-cols-2 gap-4">
          
          {/* 1) 보라색 (명세서) */}
          <Card 
            className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer rounded-2xl overflow-hidden" 
            style={{ backgroundColor: '#F5F3FF' }} /* 연보라 배경 */
            onClick={() => navigate('/app/wallet')}
          >
            <CardContent className="p-5 h-32 flex flex-col justify-between relative">
              <span className="font-bold text-lg leading-tight z-10" style={{ color: '#1F2937' }}>이용대금<br/>명세서</span>
              <div className="absolute right-4 bottom-4 w-10 h-10 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
                {/* color 속성 직접 사용 */}
                <FileText className="w-5 h-5" color="#7C3AED" strokeWidth={2.5} /> 
              </div>
            </CardContent>
          </Card>

          {/* 2) 핑크색 (이용내역) - 초록 대신 핑크로 변경하여 색감 밸런스 조정 */}
          <Card 
            className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer rounded-2xl overflow-hidden" 
            style={{ backgroundColor: '#FFF1F2' }} /* 연분홍 배경 */
            onClick={() => navigate('/app/analysis/calendar')}
          >
            <CardContent className="p-5 h-32 flex flex-col justify-between relative">
              <span className="font-bold text-lg leading-tight z-10" style={{ color: '#1F2937' }}>이용내역<br/>조회</span>
              <div className="absolute right-4 bottom-4 w-10 h-10 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
                {/* color 속성 직접 사용 */}
                <List className="w-5 h-5" color="#E11D48" strokeWidth={2.5} /> 
              </div>
            </CardContent>
          </Card>

          {/* 3) 파란색 (즉시결제) */}
          <Card 
            className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer rounded-2xl overflow-hidden" 
            style={{ backgroundColor: '#EFF6FF' }} /* 연파랑 배경 */
            onClick={() => navigate('/app/wallet')}
          >
            <CardContent className="p-5 h-32 flex flex-col justify-between relative">
              <span className="font-bold text-lg leading-tight z-10" style={{ color: '#1F2937' }}>즉시결제<br/>신청</span>
              <div className="absolute right-4 bottom-4 w-10 h-10 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
                {/* color 속성 직접 사용 */}
                <CreditCard className="w-5 h-5" color="#2563EB" strokeWidth={2.5} />
              </div>
            </CardContent>
          </Card>

          {/* 4) 노란색 (분할납부) */}
          <Card 
            className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer rounded-2xl overflow-hidden" 
            style={{ backgroundColor: '#FFFBEB' }} /* 연노랑 배경 */
            onClick={() => navigate('/app/performance')}
          >
            <CardContent className="p-5 h-32 flex flex-col justify-between relative">
              <span className="font-bold text-lg leading-tight z-10" style={{ color: '#1F2937' }}>분할납부<br/>전환</span>
              <div className="absolute right-4 bottom-4 w-10 h-10 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
                {/* color 속성 직접 사용 */}
                <PieChart className="w-5 h-5" color="#D97706" strokeWidth={2.5} />
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* 3. 배너 (그라디언트) */}
      <div className="px-6 mt-6">
         <div 
            className="rounded-2xl p-6 shadow-lg flex justify-between items-center cursor-pointer transform hover:scale-[1.02] transition-transform" 
            style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', boxShadow: '0 10px 20px -5px rgba(124, 58, 237, 0.3)' }}
            onClick={() => navigate('/survey')}
         >
            <div className="text-white">
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                   <Sparkles className="w-3 h-3" color="#FDE047" fill="currentColor" /> 
                   AI 추천
                </div>
                <h3 className="font-bold text-xl leading-tight text-white">내게 딱 맞는<br/>지원금 조회하기</h3>
            </div>
            <div className="w-14 h-14 rounded-full flex items-center justify-center border" style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.1)' }}>
                <Wallet className="w-7 h-7" color="#FFFFFF" />
            </div>
         </div>
      </div>

      {/* 4. 하단 메뉴 리스트 (파스텔 포인트 적용) */}
      <div className="p-6 space-y-3 pb-24">
        <h2 className="text-lg font-bold ml-1 mb-2" style={{ color: '#111827' }}>서비스 더보기</h2>
        
        {/* 로그인 메뉴 - 파란색 포인트 */}
        <div 
          className="rounded-xl p-5 shadow-sm border flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#F3F4F6' }}
          onClick={() => navigate('/login')}
        >
           <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#EFF6FF' }}>
              <User className="w-5 h-5" color="#2563EB" />
           </div>
           <div className="flex-1">
              <h3 className="font-bold" style={{ color: '#1F2937' }}>로그인 및 회원가입</h3>
              <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>내 자산 정보를 안전하게 관리하세요</p>
           </div>
           <ChevronRight className="w-5 h-5" color="#D1D5DB" />
        </div>

        {/* 체험하기 메뉴 - 주황색 포인트 */}
        <div 
          className="rounded-xl p-5 shadow-sm border flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#F3F4F6' }}
          onClick={() => navigate('/survey')}
        >
           <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFF7ED' }}>
              <Megaphone className="w-5 h-5" color="#EA580C" />
           </div>
           <div className="flex-1">
              <h3 className="font-bold" style={{ color: '#1F2937' }}>비회원 혜택 체험</h3>
              <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>로그인 없이 빠르게 조회하기</p>
           </div>
           <ChevronRight className="w-5 h-5" color="#D1D5DB" />
        </div>
      </div>

      {/* 개발용 서버 상태 */}
      <div className="mt-auto p-4 text-center" style={{ backgroundColor: '#F9FAFB' }}>
         <span 
           className="text-[10px] font-medium px-3 py-1 rounded-full"
           style={{ 
             backgroundColor: backendMessage.includes("실패") ? '#FEE2E2' : '#DCFCE7', 
             color: backendMessage.includes("실패") ? '#EF4444' : '#16A34A' 
           }}
         >
            ● {backendMessage}
         </span>
      </div>
    </div>
  );
};

export default Index;