import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Briefcase } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { benefitCategoryNames } from '../../../data/mockData';
import { SurveyResponse, UserGroup } from '../../../types';

const AnalysisLoading = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Survey.tsx에서 전달받은 state
  const surveyState = location.state as {
    surveyResponse: SurveyResponse;
    userGroup: UserGroup;
    cardCombinations: any[][];
  };

  // state가 없으면 설문 페이지로 리다이렉트
  useEffect(() => {
    if (!surveyState) {
      navigate('/survey');
      return;
    }

    // 2.5초간 분석 화면을 보여준 뒤 추천 페이지로 이동
    const timer = setTimeout(() => {
      navigate('/recommendations', { state: surveyState });
    }, 2500); // 2.5초

    return () => clearTimeout(timer);
  }, [navigate, surveyState]);

  // state가 없는 경우 렌더링 방지
  if (!surveyState) {
    return null; 
  }

  const { surveyResponse, userGroup } = surveyState;

  // Radar 차트 데이터 생성 (Recommendations.tsx 로직 재사용)
  const radarData = Object.entries(benefitCategoryNames).map(([category, name]) => ({
    category: name,
    user: surveyResponse.spendingCategories.includes(category as any) ? 5 : 1,
    group: userGroup?.spendingPattern?.categories[category as keyof typeof userGroup.spendingPattern.categories] || 1
  }));

  // 이미지(image_b25d95.png)와 유사한 UI 구성
  return (
    <div className="app-container flex flex-col items-center justify-center min-h-screen p-6 space-y-6 bg-gray-50">
      
      {/* 상단 텍스트 */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-primary">분석 완료!</h1>
        <p className="text-lg text-muted-foreground">당신의 소비 패턴을 분석했어요</p>
      </div>

      {/* 사용자 그룹 */}
      <div className="w-full max-w-sm p-6 bg-card rounded-lg shadow-card text-center space-y-3">
        <Briefcase className="w-12 h-12 text-primary mx-auto" />
        <h2 className="text-xl font-semibold">{userGroup.name}</h2>
        <p className="text-sm text-muted-foreground">
          {userGroup.characteristics[0] || '효율적이고 전문적인 라이프스타일의 당신!'}
        </p>
      </div>

      {/* 소비 패턴 분석 (간략한 차트) */}
      <div className="w-full max-w-sm p-6 bg-card rounded-lg shadow-card space-y-3">
        <h3 className="text-lg font-semibold text-center mb-4">소비 패턴 분석</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius={70}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Radar name="당신" dataKey="user" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
              <Radar name="그룹 평균" dataKey="group" stroke="hsl(var(--muted))" fill="hsl(var(--muted))" fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full" />
              <span className="text-xs text-muted-foreground">당신</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-muted rounded-full" />
              <span className="text-xs text-muted-foreground">그룹 평균</span>
            </div>
          </div>
      </div>
      
      {/* 하단 로딩 스피너 */}
      <div className="flex items-center space-x-2 text-muted-foreground pt-4">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>추천 카드를 불러오는 중...</span>
      </div>
    </div>
  );
};

export default AnalysisLoading;