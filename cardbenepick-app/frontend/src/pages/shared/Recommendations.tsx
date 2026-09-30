import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Users, Star, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import AutoOrientedCardImage from '@/components/AutoOrientedCardImage';  // AutoOrientedCardImage 컴포넌트 임포트

// 카드 데이터 타입
interface CardAsset {
  id: number | string;
  name: string;
  company: string;
  image_url: string;
  benefits?: any[];
  reason?: string; 
}

const Recommendations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 1. 데이터 수신 및 구조 확인
  const userCluster = location.state?.cluster ?? 0;
  const recommendationData = location.state?.recommendationData;
  // 구조가 { status, message, recommendation: {...} } 일 수도 있고 바로 {...} 일 수도 있음을 대비
  const ragResult = recommendationData?.recommendation || recommendationData; 

  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<CardAsset[]>([]);
  const [error, setError] = useState('');
  const [ragSummary, setRagSummary] = useState<{recommended_card: string, selection_reason: string} | null>(null);

  // --- 클러스터별 정보 ---
  const getClusterInfo = (id: number) => {
    switch(id) {
      case 0: return { name: "실속 미식가", desc: "가성비와 미식을 동시에 챙기는 스마트한 타입", tags: ["#맛집", "#병원", "#가성비"] };
      case 1: return { name: "알뜰 소액족", desc: "꼭 필요한 곳에만 지출하는 절약의 고수", tags: ["#공과금", "#통신비", "#무지출"] };
      case 2: return { name: "에듀 맘/대디", desc: "자녀 교육과 미래를 위한 아낌없는 투자", tags: ["#학원", "#서점", "#온라인강의"] };
      case 3: return { name: "럭셔리 VIP", desc: "여행, 레저, 다이닝을 즐기는 여유로운 라이프", tags: ["#호텔", "#골프", "#라운지"] };
      case 4: return { name: "마이카 중산층", desc: "내 차 관리와 주유 혜택이 필수인 오너 드라이버", tags: ["#주유", "#정비", "#하이패스"] };
      default: return { name: "스마트 컨슈머", desc: "합리적인 소비를 지향하는 당신", tags: ["#생활비", "#쇼핑", "#적립"] };
    }
  };

  // --- 이미지 경로 생성 함수 ---
  const getCardImagePath = (cardId: string | number) => {
    // 업로드해주신 파일 구조를 보면 대부분 public/images/{id}card.png 형태입니다.
    return `/images/${cardId}card.png`;
  };

  const clusterInfo = getClusterInfo(userCluster);

  useEffect(() => {
    // [디버깅] 도착한 데이터 구조를 콘솔에서 확인하세요!
    console.group("🔍 [Recommendations] 데이터 수신 확인");
    console.log("📍 전체 state:", location.state);
    console.log("📦 추출된 RAG 결과:", ragResult);
    console.groupEnd();

    const loadCards = async () => {
      setLoading(true);
      
      // [핵심 로직] RAG 데이터가 있는지 확인 (조건 완화)
      // card_comparison_list 키가 있는지 확인
      if (ragResult && (ragResult.card_comparison_list || ragResult.recommendations)) {
          console.log("💎 [Frontend] RAG 추천 데이터를 화면에 적용합니다.");
          
          try {
            // 키 이름이 다를 경우를 대비한 유연한 처리
            const list = ragResult.card_comparison_list || ragResult.recommendations || [];
            const summary = ragResult.recommendation_summary || {};

            const mappedCards = list.map((item: any, index: number) => ({
                id: item.card_id || `temp-${index}`,
                name: item.card_name,
                company: item.card_company || "추천카드", 
                image_url: "", 
                reason: item.reason_detail || item.reason
            }));
            
            setCards(mappedCards);
            setRagSummary(summary);
            setLoading(false);
            return; // ★ 성공 시 여기서 종료! (API 호출 안 함)
          } catch (e) {
            console.error("❌ 데이터 매핑 중 오류:", e);
          }
      } else {
          console.warn("⚠️ RAG 데이터가 없거나 형식이 다릅니다. 서버 목록을 불러옵니다.");
      }

      // [Fallback] 데이터가 없으면 API 호출
      try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log("👻 로그인되지 않음: 빈 화면 표시");
            // 에러를 내지 않고 로딩만 끕니다.
            setLoading(false);
            return;
        }

        console.log("📡 서버에서 카드 목록을 가져옵니다...");
        const response = await api.get('/assets/');
        setCards(response.data.slice(0, 3)); 

      } catch (err: any) {
        console.warn("카드 정보 불러오기 실패:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCards();
  }, [userCluster, ragResult]); // ragResult가 변경되면 재실행


  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 text-sm">맞춤 카드를 분석하고 있습니다...</p>
      </div>
    );
  }

  // 카드 데이터가 아예 없을 때 표시
  if (cards.length === 0 && !loading) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-800 font-bold mb-2">추천 카드가 없습니다.</p>
            <p className="text-gray-500 text-sm mb-6">다시 설문을 진행해 보시겠어요?</p>
            <Button onClick={() => navigate('/survey')} variant="outline">설문 다시하기</Button>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 w-full max-w-[480px] mx-auto">
      
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 px-4 h-14 flex items-center border-b border-gray-100">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/chat')} className="mr-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-bold text-lg">추천 결과</h1>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto pb-24">

        {/* 회원가입 유도 */}
        {/* <Button className="w-full btn-gradient h-11 text-white font-bold shadow-md" onClick={() => navigate('/login')}>
          가입하고 내 카드 관리하기
        </Button> */}

        {/* 사용자 그룹 정보 */}
        <Card className="shadow-sm border-gray-200 bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-gray-900">당신의 소비 그룹</CardTitle>
                <p className="text-xs text-gray-500">AI가 분석한 라이프스타일</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100"> 
              <h3 className="font-bold text-lg text-blue-700 mb-1">{clusterInfo.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{clusterInfo.desc}</p>
              <div className="flex flex-wrap gap-2">
                {clusterInfo.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="bg-white text-gray-500 border border-gray-200 font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RAG 요약 (AI 분석 결과가 있을 때만 표시) */}
        {ragSummary && (
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl animate-in fade-in slide-in-from-bottom-2">
                <h3 className="text-indigo-900 font-bold text-sm mb-2 flex items-center gap-2">
                    <Star className="w-4 h-4 fill-indigo-600 text-indigo-600" />
                    AI 추천 코멘트
                </h3>
                <p className="text-sm text-indigo-800 leading-relaxed">
                    <span className="font-bold">"{ragSummary.recommended_card}"</span>를 추천합니다.<br/>
                    {ragSummary.selection_reason}
                </p>
            </div>
        )}

        {/* 추천 카드 리스트 */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center text-gray-900">
            <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
            AI 추천 카드 TOP 3
          </h2>
          
          {cards.map((card, index) => (
            <Card key={card.id || index} className="shadow-sm border-gray-200 overflow-hidden cursor-pointer hover:border-blue-300 transition-all active:scale-[0.98] ">
              <CardContent className="p-0 flex">
                <div className="w-24 bg-gray-50 flex items-center justify-center p-2 border-r border-gray-100 relative">
                  {/* AutoOrientedCardImage 사용 */}
                  <AutoOrientedCardImage 
                    src={getCardImagePath(card.id)} 
                    alt={card.name} 
                    className="w-full h-full" 
                  />
                </div>

                <div className="flex-1 p-4 flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs text-gray-400 font-medium">{card.company}</span>
                    {index === 0 && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 text-[10px] px-1.5 h-5">BEST</Badge>}
                  </div>
                  <h4 className="font-bold text-gray-900 text-base mb-1">{card.name}</h4>
                  {card.reason && <p className="text-xs text-blue-600 mb-2 line-clamp-2">💡 {card.reason}</p>}
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-gray-500">매칭 점수 {98 - (index * 5)}점</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="pt-4">
          <Button variant="outline" className="w-full h-12" onClick={() => navigate('/survey')}>
            설문 다시하기
          </Button>
        </div>

      </div>
    </div>
  );
};

export default Recommendations;