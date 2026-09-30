import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PieChart, CreditCard, BarChart, BarChart2, Plus, User, CalendarDays, Sparkles, Bell } from 'lucide-react';

const analysisMenuItems = [
  {
    title: "마이페이지",
    description: (
      <>
        내 정보 및<br /> 로그아웃
      </>
    ),
    icon: User,
    link: "/app/mypage", // 마이페이지 라우트
  },
  {
    title: "소비 패턴",
    description: (
      <>
        카테고리별<br /> 지출 분석
      </>
    ),
    icon: PieChart,
    link: "/app/analysis/detail", 
  },
  {
    title: "소비 달력",
    description: (
      <>  
        월별 지출<br />캘린더
      </>
    ),
    icon: CalendarDays,
    link: "/app/analysis/calendar", // 캘린더 페이지 라우트
  },
  {
    title: "카드 실적",
    description: (  
      <>  
        보유 카드<br />실적 현황
      </>
    ),
    icon: CreditCard,
    link: "/app/performance", 
  },
  {
    title: "카드 추천",
    description: (
      <>
        AI 맞춤형<br />카드 찾기
      </>
    ),
    icon: Sparkles,
    link: "/survey/recommend-type-select", // 설문조사 페이지로 이동
  },
  {
    title: "소비 리포트",
    description: (
      <>
        올해의 소비 분석<br />AI 리포트
      </>
    ),
    icon: BarChart2, // 소비 리포트에 맞는 그래프 아이콘
    link: "/app/analysis/report", // 소비 리포트 페이지 라우트
  },
];

const Analysis = () => {
  const navigate = useNavigate();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <h1 className="text-lg font-semibold flex-1 text-center">전체</h1>
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-4" 
          onClick={() => navigate('/app/notifications')}
        >
          <Bell className="w-8 h-8 text-gray-700" /> {/* Bell 아이콘 크기 확대 */}
        </Button>
      </div>

      {/* Content (2개의 버튼 메뉴씩) */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4"> {/* 2개씩 배치하도록 수정 */}
          {analysisMenuItems.map((item) => (
            <Card 
              key={item.title} 
              className="shadow-card hover:shadow-elevated transition-shadow cursor-pointer"
              onClick={() => navigate(item.link)}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center text-center h-32">
                <item.icon className="w-8 h-8 text-primary mb-2" />
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
              </CardContent>
            </Card>
          ))}

        </div>
      </div>
    </div>
  );
};

export default Analysis;
