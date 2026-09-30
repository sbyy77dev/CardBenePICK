// import { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   ArrowLeft,
//   CreditCard,
//   CheckCircle,
//   AlertCircle,
//   Clock,
//   Loader2,
// } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { fetchWithAuth } from '@/lib/api';
// import { cn } from '@/lib/utils';

// // 화면에 표시할 데이터 타입
// interface RealtimeCardData {
//   card_id: string; // 이동을 위해 ID 추가
//   card_name: string;
//   current_usage: number;
//   last_month_usage: number;
//   requirement: number;
//   image_url: string; // 파일명 대신 전체 URL 사용
//   card_number?: string; // navigate 시 fallback용(있다면)
// }

// const CardPerformance = () => {
//   const navigate = useNavigate();
//   const [cards, setCards] = useState<RealtimeCardData[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const loadData = async () => {
//       try {
//         // [수정] 존재하지 않는 API 대신, 실제 작동하는 '내 자산 조회' API 사용
//         const res = await fetchWithAuth('http://localhost:8000/api/assets/');

//         if (res.ok) {
//           const assets = await res.json();

//           // [데이터 변환] 백엔드 데이터(UserAsset)를 화면에 맞는 형태(RealtimeCardData)로 변환
//           const formattedData: RealtimeCardData[] = assets.map((asset: any) => ({
//             card_id: asset.external_account_id || asset.external_account_name, // 상세 이동용 ID
//             card_name: asset.external_account_name || asset.institution_name,
//             // balance가 마이너스일 수 있으므로 절대값 처리
//             current_usage: Math.abs(asset.balance),
//             // 지난달 실적은 DB에 없으므로, 현재 실적과 비슷하게 임의 설정 (실제 서비스라면 별도 API 필요)
//             last_month_usage: Math.floor(Math.abs(asset.balance) * 0.9),
//             // 목표 실적은 DB에 없으므로 기본값 30만원 설정 (또는 혜택 분석 로직 필요)
//             requirement: 300000,
//             // 이미지 URL 생성 (ID 기반)
//             image_url: asset.external_account_id
//               ? `http://localhost:8080/${asset.external_account_id}card.png`
//               : 'http://localhost:8080/placeholder.svg',
//             card_number: asset.card_number, // 있을 경우용(선택)
//           }));

//           setCards(formattedData);
//         }
//       } catch (error) {
//         console.error('데이터 로드 실패:', error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     loadData();
//   }, []);

//   // 달성률 계산 (정수 + 100% 상한)
//   const getProgressPercentage = (current: number, required: number) => {
//     if (required === 0) return 100;
//     return Math.min(Math.round((current / required) * 100), 100);
//   };

//   // 상태 배지 정보
//   const getStatusInfo = (current: number, required: number) => {
//     const ratio = current / required;
//     if (ratio >= 1)
//       return {
//         text: '달성 완료',
//         badgeClass: 'bg-green-100 text-green-700',
//         icon: <CheckCircle className="w-5 h-5 text-green-600" />,
//       };
//     if (ratio >= 0.8)
//       return {
//         text: '달성 임박',
//         badgeClass: 'bg-yellow-100 text-yellow-700',
//         icon: <Clock className="w-5 h-5 text-yellow-600" />,
//       };
//     return {
//       text: '달성 필요',
//       badgeClass: 'bg-red-100 text-red-700',
//       icon: <AlertCircle className="w-5 h-5 text-red-600" />,
//     };
//   };

//   // 상단 요약 카운트
//   const achievedCount = cards.filter(
//     (c) => c.current_usage >= c.requirement,
//   ).length;
//   const warningCount = cards.filter(
//     (c) =>
//       c.current_usage < c.requirement &&
//       c.current_usage / c.requirement >= 0.8,
//   ).length;
//   const dangerCount = cards.filter(
//     (c) =>
//       c.current_usage < c.requirement &&
//       c.current_usage / c.requirement < 0.8,
//   ).length;

//   return (
//     <div className="bg-gray-50 min-h-screen pb-10">
//       {/* 헤더 */}
//       <div className="flex items-center p-4 border-b bg-white sticky top-0 z-10">
//         <Button
//           variant="ghost"
//           size="icon"
//           onClick={() => navigate(-1)}
//           className="mr-3"
//         >
//           <ArrowLeft className="w-5 h-5" />
//         </Button>
//         <h1 className="text-lg font-semibold">카드 실적 현황</h1>
//       </div>

//       {/* 로딩 및 에러 처리 */}
//       {loading ? (
//         <div className="flex justify-center py-20">
//           <Loader2 className="w-8 h-8 animate-spin text-primary" />
//         </div>
//       ) : cards.length === 0 ? (
//         <div className="text-center text-gray-400 py-20">
//           보유한 카드가 없습니다.
//         </div>
//       ) : (
//         <div className="p-4 space-y-6">
//           {/* 1. 상단 요약 */}
//           <div className="grid grid-cols-3 gap-3">
//             <Card className="shadow-sm border-none">
//               <CardContent className="p-4 text-center">
//                 <div className="text-xl font-bold text-green-600">
//                   {achievedCount}
//                 </div>
//                 <div className="text-xs text-gray-500">달성 완료</div>
//               </CardContent>
//             </Card>
//             <Card className="shadow-sm border-none">
//               <CardContent className="p-4 text-center">
//                 <div className="text-xl font-bold text-yellow-500">
//                   {warningCount}
//                 </div>
//                 <div className="text-xs text-gray-500">달성 임박</div>
//               </CardContent>
//             </Card>
//             <Card className="shadow-sm border-none">
//               <CardContent className="p-4 text-center">
//                 <div className="text-xl font-bold text-red-500">
//                   {dangerCount}
//                 </div>
//                 <div className="text-xs text-gray-500">달성 필요</div>
//               </CardContent>
//             </Card>
//           </div>

//           {/* 2. 이번 달 실적 리스트 */}
//           <div className="space-y-4">
//             <h2 className="text-lg font-bold text-gray-800 px-1">
//               이번 달 실적 현황
//             </h2>
//             {cards.map((card, index) => {
//               const status = getStatusInfo(
//                 card.current_usage,
//                 card.requirement,
//               );
//               // [수정] 정수 + 100 상한 달성률
//               const percent = getProgressPercentage(
//                 card.current_usage,
//                 card.requirement,
//               );

//               return (
//                 <Card
//                   key={index}
//                   className="shadow-sm border-gray-100 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
//                   // [수정] 클릭 시 카드 상세 페이지로 이동
//                   onClick={() =>
//                     navigate(
//                       `/app/card/${encodeURIComponent(
//                         card.card_id || card.card_number || '',
//                       )}`,
//                       { state: { isOwned: true } },
//                     )
//                   }
//                 >
//                   <CardHeader className="pb-3 bg-white border-b border-gray-50">
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center space-x-3">
//                         {/* 카드 이미지 */}
//                         <img
//                           src={card.image_url}
//                           alt={card.card_name}
//                           className="w-16 h-10 object-contain"
//                           onError={(e) => {
//                             e.currentTarget.src =
//                               'http://localhost:8080/placeholder.svg';
//                           }}
//                         />
//                         <div>
//                           <CardTitle className="text-sm font-bold">
//                             {card.card_name}
//                           </CardTitle>
//                           <p className="text-xs text-gray-400 mt-0.5">
//                             목표 {card.requirement.toLocaleString()}원
//                           </p>
//                         </div>
//                       </div>
//                       <Badge
//                         className={cn(
//                           'px-2 py-1 text-[10px] font-bold border-0',
//                           status.badgeClass,
//                         )}
//                       >
//                         {status.text}
//                       </Badge>
//                     </div>
//                   </CardHeader>
//                   <CardContent className="pt-4 pb-5 space-y-3">
//                     <div className="flex justify-between text-sm font-medium">
//                       <span className="text-gray-600">실적 진행률</span>
//                       <span className="text-gray-900">
//                         {card.current_usage.toLocaleString()}원
//                       </span>
//                     </div>
//                     <div className="relative w-full bg-gray-100 rounded-full h-2.5">
//                       <div
//                         className={cn(
//                           'h-2.5 rounded-full transition-all duration-1000',
//                           percent >= 100
//                             ? 'bg-green-500'
//                             : percent >= 80
//                             ? 'bg-yellow-500'
//                             : 'bg-blue-600',
//                         )}
//                         style={{ width: `${percent}%` }}
//                       />
//                     </div>
//                   </CardContent>
//                 </Card>
//               );
//             })}
//           </div>

//           {/* 3. 지난 달 실적 요약 */}
//           <Card className="shadow-sm border-gray-100">
//             <CardHeader>
//               <CardTitle className="text-lg">지난 달 실적 요약</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-3">
//                 {cards.map((card, index) => {
//                   const isLastMonthAchieved =
//                     card.last_month_usage >= card.requirement;

//                   return (
//                     <div
//                       key={index}
//                       className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
//                     >
//                       {/* 왼쪽: 이미지 + 텍스트 */}
//                       <div className="flex items-center gap-3">
//                         <img
//                           src={card.image_url}
//                           alt={card.card_name}
//                           className="w-10 h-10 object-contain"
//                           onError={(e) => {
//                             e.currentTarget.src =
//                               'http://localhost:8080/placeholder.svg';
//                           }}
//                         />

//                         <div className="flex flex-col">
//                           <p className="font-medium text-sm text-gray-700">
//                             {card.card_name}
//                           </p>
//                           <p className="text-[10px] text-gray-400">
//                             {card.last_month_usage.toLocaleString()}원 사용
//                           </p>
//                         </div>
//                       </div>

//                       {/* 오른쪽: 달성 배지 */}
//                       <Badge
//                         variant="outline"
//                         className={cn(
//                           'border-0 px-2 py-1 text-[11px] font-bold',
//                           isLastMonthAchieved
//                             ? 'bg-green-100 text-green-700'
//                             : 'bg-gray-200 text-gray-500',
//                         )}
//                       >
//                         {isLastMonthAchieved ? '달성' : '미달성'}
//                       </Badge>
//                     </div>
//                   );
//                 })}
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CardPerformance;


// import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchWithAuth } from '@/lib/api';
import { cn } from '@/lib/utils';
// [변경] Hook 임포트
import { useCardPerformance } from '@/hooks/useAnalysis';



// // 백엔드 데이터 타입 (파일명만 받음)
// interface CardPerformanceData {
//   card_id: string;
//   card_name: string;
//   card_company: string;
//   current_usage: number;
//   last_month_usage: number;
//   requirement: number;
//   image_filename: string; 
// }

const CardPerformance = () => {
  const navigate = useNavigate();

  // [변경] React Query 훅 사용 (데이터와 로딩 상태를 한 번에 받음)
  const { data: cards = [], isLoading } = useCardPerformance();

  const getProgressPercentage = (current: number, required: number) => {
    if (!required || required === 0) return 100;
    const safeCurrent = current || 0;
    return Math.min(Math.round((safeCurrent / required) * 100), 100);
  };

  const getStatusInfo = (current: number, required: number) => {
    const safeCurrent = current || 0;
    const safeRequired = required || 1;
    const ratio = safeCurrent / safeRequired;
    
    if (ratio >= 1)
      return {
        text: '달성 완료',
        badgeClass: 'bg-green-100 text-green-700',
        icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      };
    if (ratio >= 0.8)
      return {
        text: '달성 임박',
        badgeClass: 'bg-yellow-100 text-yellow-700',
        icon: <Clock className="w-5 h-5 text-yellow-600" />,
      };
    return {
      text: '달성 필요',
      badgeClass: 'bg-red-100 text-red-700',
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
    };
  };

  // 통계 계산 (cards 데이터가 있으면 계산, 없으면 0)
  const achievedCount = cards.filter((c) => (c.current_usage || 0) >= c.requirement).length;
  
  const warningCount = cards.filter((c) => {
    const usage = c.current_usage || 0;
    const req = c.requirement || 1;
    return usage < req && usage / req >= 0.8;
  }).length;
  
  const dangerCount = cards.filter((c) => {
    const usage = c.current_usage || 0;
    const req = c.requirement || 1;
    return usage < req && usage / req < 0.8;
  }).length;
  // const [cards, setCards] = useState<CardPerformanceData[]>([]);
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   const loadData = async () => {
  //     try {
  //       const res = await fetchWithAuth('http://localhost:8000/api/analysis/realtime-cards');

  //       if (res.ok) {
  //         const data = await res.json();
  //         setCards(data);
  //       }
  //     } catch (error) {
  //       console.error('데이터 로드 실패:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   loadData();
  // }, []);

  // const getProgressPercentage = (current: number, required: number) => {
  //   if (!required || required === 0) return 100;
  //   const safeCurrent = current || 0;
  //   return Math.min(Math.round((safeCurrent / required) * 100), 100);
  // };

  // const getStatusInfo = (current: number, required: number) => {
  //   const safeCurrent = current || 0;
  //   const safeRequired = required || 1;
  //   const ratio = safeCurrent / safeRequired;
    
  //   if (ratio >= 1)
  //     return {
  //       text: '달성 완료',
  //       badgeClass: 'bg-green-100 text-green-700',
  //       icon: <CheckCircle className="w-5 h-5 text-green-600" />,
  //     };
  //   if (ratio >= 0.8)
  //     return {
  //       text: '달성 임박',
  //       badgeClass: 'bg-yellow-100 text-yellow-700',
  //       icon: <Clock className="w-5 h-5 text-yellow-600" />,
  //     };
  //   return {
  //     text: '달성 필요',
  //     badgeClass: 'bg-red-100 text-red-700',
  //     icon: <AlertCircle className="w-5 h-5 text-red-600" />,
  //   };
  // };

  // const achievedCount = cards.filter((c) => (c.current_usage || 0) >= c.requirement).length;
  
  // const warningCount = cards.filter((c) => {
  //   const usage = c.current_usage || 0;
  //   const req = c.requirement || 1;
  //   return usage < req && usage / req >= 0.8;
  // }).length;
  
  // const dangerCount = cards.filter((c) => {
  //   const usage = c.current_usage || 0;
  //   const req = c.requirement || 1;
  //   return usage < req && usage / req < 0.8;
  // }).length;

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      <div className="flex items-center p-4 border-b bg-white sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">카드 실적 현황</h1>
      </div>

      {isLoading ? (  // <--- 이 부분을 확인하세요!
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center text-gray-400 py-20">
          보유한 카드가 없습니다.
        </div>
      ) : (
        <div className="p-4 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <Card className="shadow-sm border-none">
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-green-600">
                  {achievedCount}
                </div>
                <div className="text-xs text-gray-500">달성 완료</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-none">
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-yellow-500">
                  {warningCount}
                </div>
                <div className="text-xs text-gray-500">달성 임박</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-none">
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-red-500">
                  {dangerCount}
                </div>
                <div className="text-xs text-gray-500">달성 필요</div>
              </CardContent>
            </Card>
          </div>

          {/* 이번 달 리스트 */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800 px-1">
              이번 달 실적 현황
            </h2>
            {cards.map((card, index) => {
              const status = getStatusInfo(card.current_usage, card.requirement);
              const percent = getProgressPercentage(card.current_usage, card.requirement);

              return (
                <Card
                  key={index}
                  className="shadow-sm border-gray-100 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={() =>
                    navigate(
                      `/app/card/${encodeURIComponent(card.card_id)}`,
                      { state: { isOwned: true } },
                    )
                  }
                >
                  <CardHeader className="pb-3 bg-white border-b border-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {/* [핵심 수정] 상대 경로 사용 (/images/ + 파일명) */}
                        <img
                          src={`/images/${card.image_filename}`}
                          alt={card.card_name}
                          className="w-16 h-10 object-contain"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg'; // 여기도 상대 경로
                          }}
                        />
                        <div>
                          <CardTitle className="text-sm font-bold">
                            {card.card_name}
                          </CardTitle>
                          <p className="text-xs text-gray-400 mt-0.5">
                            목표 {card.requirement.toLocaleString()}원
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          'px-2 py-1 text-[10px] font-bold border-0',
                          status.badgeClass,
                        )}
                      >
                        {status.text}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 pb-5 space-y-3">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-600">실적 진행률</span>
                      <span className="text-gray-900">
                        {(card.current_usage || 0).toLocaleString()}원
                      </span>
                    </div>
                    <div className="relative w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className={cn(
                          'h-2.5 rounded-full transition-all duration-1000',
                          percent >= 100
                            ? 'bg-green-500'
                            : percent >= 80
                            ? 'bg-yellow-500'
                            : 'bg-blue-600',
                        )}
                        style={{ width: `${percent || 0}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 지난 달 리스트 */}
          <Card className="shadow-sm border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg">지난 달 실적 요약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cards.map((card, index) => {
                  const isLastMonthAchieved = (card.last_month_usage || 0) >= card.requirement;

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {/* [핵심 수정] 여기도 상대 경로 */}
                        <img
                          src={`/images/${card.image_filename}`}
                          alt={card.card_name}
                          className="w-10 h-10 object-contain"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                        <div className="flex flex-col">
                          <p className="font-medium text-sm text-gray-700">
                            {card.card_name}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {(card.last_month_usage || 0).toLocaleString()}원 사용
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={cn(
                          'border-0 px-2 py-1 text-[11px] font-bold',
                          isLastMonthAchieved
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-500',
                        )}
                      >
                        {isLastMonthAchieved ? '달성' : '미달성'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CardPerformance;