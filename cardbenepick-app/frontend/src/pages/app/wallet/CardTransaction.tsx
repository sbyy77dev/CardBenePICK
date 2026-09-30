import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, 
  SearchX, ShoppingBag, Coffee, Bus, Fuel, Utensils, ShoppingCart, Smartphone, Ticket, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  format, subMonths, addMonths, parseISO, isSameMonth, isFuture 
} from 'date-fns';
import { ko } from 'date-fns/locale';

import { transactionApi, TransactionItem } from '@/api/transaction';
import { useCardStore } from '@/store/useCardStore';
import { IMAGE_BASE_URL, PLACEHOLDER_IMAGE_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';

// 거래 내역 아이템 확장 타입 (할인 금액 포함)
interface ExtendedTransactionItem extends TransactionItem {
  discount_amount?: number;
}

// --- 아이콘 매핑 (다채로운 파스텔 톤 적용) ---
const getCategoryIcon = (merchantName: string) => {
  const name = merchantName.toLowerCase();
  const iconClass = "w-4 h-4 text-white"; 

  // 1. 카페/베이커리 -> Pale Green (#A5D6A7) or Warm Brown (#BCAAA4)
  if (name.includes('스타벅스') || name.includes('카페') || name.includes('투썸') || name.includes('커피')) {
    return <div className="bg-[#A5D6A7] p-2 rounded-full"><Coffee className={iconClass} /></div>;
  }
  if (name.includes('파리바게뜨') || name.includes('뚜레쥬르') || name.includes('베이커리')) {
    return <div className="bg-[#BCAAA4] p-2 rounded-full"><Coffee className={iconClass} /></div>;
  }

  // 2. 쇼핑/마트/편의점 -> Cyan Blue (#80DEEA) or Lavender Purple (#CE93D8)
  if (name.includes('편의점') || name.includes('gs25') || name.includes('cu') || name.includes('세븐일레븐')) {
    return <div className="bg-[#80DEEA] p-2 rounded-full"><ShoppingCart className={iconClass} /></div>;
  }
  if (name.includes('마트') || name.includes('이마트') || name.includes('홈플러스')) {
     return <div className="bg-[#80DEEA] p-2 rounded-full"><ShoppingCart className={iconClass} /></div>;
  }
  if (name.includes('백화점') || name.includes('아울렛') || name.includes('쇼핑')) {
    return <div className="bg-[#CE93D8] p-2 rounded-full"><ShoppingBag className={iconClass} /></div>;
  }

  // 3. 교통/주유 -> Sunshine Yellow (#FFEE58) or Cool Grey (#90A4AE)
  if (name.includes('택시') || name.includes('버스') || name.includes('지하철') || name.includes('코레일')) {
    return <div className="bg-[#FFD54F] p-2 rounded-full"><Bus className={iconClass} /></div>;
  }
  if (name.includes('주유') || name.includes('oil') || name.includes('gs칼텍스')) {
    return <div className="bg-[#90A4AE] p-2 rounded-full"><Fuel className={iconClass} /></div>;
  }

  // 4. 식사 -> Mellow Orange (#FFD180)
  if (name.includes('식당') || name.includes('음식') || name.includes('버거') || name.includes('치킨') || name.includes('피자')) {
    return <div className="bg-[#FFCC80] p-2 rounded-full"><Utensils className={iconClass} /></div>;
  }

  // 5. 통신/구독 -> Sky Blue (#90CAF9)
  if (name.includes('통신') || name.includes('skt') || name.includes('kt') || name.includes('lgu+')) {
    return <div className="bg-[#90CAF9] p-2 rounded-full"><Smartphone className={iconClass} /></div>;
  }

  // 6. 문화/엔터 -> Soft Coral (#FF8A80)
  if (name.includes('넷플릭스') || name.includes('영화') || name.includes('cgv') || name.includes('롯데시네마')) {
    return <div className="bg-[#FF8A80] p-2 rounded-full"><Ticket className={iconClass} /></div>;
  }
  
  // 기본 -> Cool Grey (#B0BEC5)
  return <div className="bg-[#B0BEC5] p-2 rounded-full"><ShoppingBag className={iconClass} /></div>;
};

const CardTransaction = () => {
  const navigate = useNavigate();
  const { cardId } = useParams<{ cardId: string }>();
  const location = useLocation();
  const { assets } = useCardStore();

  const [currentDate, setCurrentDate] = useState(new Date());

  // 1. 카드 정보 찾기
  const cardInfo = useMemo(() => {
    const fromState = location.state?.cardInfo;
    if (fromState) return fromState;
    if (assets.length > 0) {
      return assets.find(a => a.asset_id.toString() === cardId);
    }
    return null;
  }, [assets, cardId, location.state]);

  // 2. API 데이터 호출
  // transactionApi.getCardHistory는 이미 백엔드에서 user_id와 card_id로 필터링된 데이터를 가져옵니다.
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['cardHistory', cardId, format(currentDate, 'yyyy-MM')],
    queryFn: () => transactionApi.getCardHistory(
      Number(cardId),
      currentDate.getFullYear(),
      currentDate.getMonth() + 1
    ),
    enabled: !!cardId,
  });

  // [디버깅 로그]
  useEffect(() => {
    if (transactions) {
        console.log(`[CardTransaction] ✅ 데이터 수신 완료 (${transactions.length}건)`);
    }
  }, [transactions]);


  // 3. 통계 계산 및 날짜별 그룹화
  const { totalAmount, totalBenefit, groupedTransactions } = useMemo(() => {
    let amountSum = 0;
    let benefitSum = 0;
    
    // 최신순 정렬
    const sortedList = [...transactions].sort((a, b) => 
      new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
    );

    // 통계 계산
    sortedList.forEach((tx: ExtendedTransactionItem) => {
        if (true) {
            // [중요] amount_krw와 discount_amount 필드를 사용합니다.
            amountSum += tx.amount_krw;
            benefitSum += (tx.discount_amount || 0);
        }
    });

    // 날짜별 그룹화
    const grouped: Record<string, ExtendedTransactionItem[]> = {};
    sortedList.forEach(tx => {
        const dateKey = tx.transaction_date.split('T')[0]; // YYYY-MM-DD
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(tx);
    });

    return { 
      totalAmount: amountSum, 
      totalBenefit: benefitSum,
      groupedTransactions: grouped
    };
  }, [transactions]);

  const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
  
  const nextMonthDate = addMonths(currentDate, 1);
  const isNextBtnDisabled = nextMonthDate > new Date();

  // [수정] 이미지 확장자 처리 로직
  const [currentImageSrc, setCurrentImageSrc] = useState<string>('');

  // cardId가 변경될 때마다 초기값을 .png로 리셋
  useEffect(() => {
    if (cardId) {
        setCurrentImageSrc(`${IMAGE_BASE_URL}/${cardId}card.png`);
    }
  }, [cardId]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    const currentSrc = target.src;

    if (currentSrc.endsWith('.png')) {
        setCurrentImageSrc(`${IMAGE_BASE_URL}/${cardId}card.jpg`);
    } else if (currentSrc.endsWith('.jpg')) {
        setCurrentImageSrc(`${IMAGE_BASE_URL}/${cardId}card.gif`);
    } else if (currentSrc.endsWith('.gif')) {
        setCurrentImageSrc(PLACEHOLDER_IMAGE_URL);
        target.onerror = null;
    } else {
        setCurrentImageSrc(PLACEHOLDER_IMAGE_URL);
        target.onerror = null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FA]">
      {/* Header */}
      <div className="flex items-center p-4 bg-white sticky top-0 z-10 border-b border-gray-100 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2 hover:bg-[#E0F7FA] hover:text-[#45B7D1]">
          <ArrowLeft className="w-6 h-6 text-[#343A40]" />
        </Button>
        <h1 className="text-lg font-bold text-[#343A40]">카드 이용 내역</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-8 scrollbar-hide">
        {/* --- 상단 카드 정보 & 월별 요약 --- */}
        <div className="bg-white pb-8 pt-4 flex flex-col items-center border-b border-gray-100 rounded-b-[2rem] shadow-sm z-0 mb-4">
            
            <div className="w-40 h-auto my-4 shadow-md rounded-xl overflow-hidden transform transition-transform hover:scale-105 duration-300">
                <img 
                    src={currentImageSrc || PLACEHOLDER_IMAGE_URL} 
                    alt={cardInfo?.external_account_name || "카드"} 
                    className="w-full h-full object-contain bg-gray-50"
                    onError={handleImageError}
                />
            </div>
            
            <div className="flex items-center justify-center space-x-8 mb-6">
                <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-[#E0F7FA] text-[#868E96] hover:text-[#45B7D1] transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <span className="text-xl font-extrabold text-[#343A40] tracking-tight">
                    {format(currentDate, 'yyyy년 M월', { locale: ko })}
                </span>
                <button 
                    onClick={handleNextMonth} 
                    disabled={isNextBtnDisabled}
                    className={cn("p-2 rounded-full transition-colors", isNextBtnDisabled ? "text-gray-200 cursor-not-allowed" : "text-[#868E96] hover:bg-[#E0F7FA] hover:text-[#45B7D1]")}
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>

            <div className="text-center w-full px-8 space-y-2">
                <h2 className="text-sm font-medium text-[#868E96] mb-4">
                    {cardInfo?.external_account_name || cardInfo?.institution_name || '내 카드'}
                </h2>
                
                <div className="flex justify-between items-center w-full max-w-[300px] mx-auto py-3 px-4 bg-[#F8F9FA] rounded-2xl border border-gray-100">
                    <div className="text-center">
                        <p className="text-[11px] text-[#868E96] mb-1">이번 달 사용 금액</p>
                        <p className="text-lg font-bold text-[#343A40]">
                            {isLoading ? <Skeleton className="h-6 w-20 mx-auto bg-gray-200" /> : `${totalAmount.toLocaleString()}원`}
                        </p>
                    </div>
                    <div className="h-8 w-[1px] bg-gray-300"></div>
                    <div className="text-center">
                        <p className="text-[11px] text-[#868E96] mb-1">받은 혜택</p>
                        <p className="text-lg font-bold text-[#45B7D1]">
                            {isLoading ? <Skeleton className="h-6 w-20 mx-auto bg-gray-200" /> : `${totalBenefit.toLocaleString()}원`}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* --- 거래 내역 리스트 --- */}
        <div className="px-0">
            {isLoading ? (
                // Loading Skeletons
                <div className="px-5 py-4 space-y-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-3">
                            <Skeleton className="w-20 h-4 bg-gray-200" />
                            <div className="flex justify-between">
                                <div className="space-y-1">
                                    <Skeleton className="w-32 h-5 bg-gray-200" />
                                    <Skeleton className="w-16 h-3 bg-gray-100" />
                                </div>
                                <Skeleton className="w-24 h-5 bg-gray-200" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : Object.keys(groupedTransactions).length > 0 ? (
                Object.entries(groupedTransactions).map(([dateStr, txs]) => {
                    const dateObj = parseISO(dateStr);
                    return (
                        <div key={dateStr} className="mb-4">
                            {/* 날짜 헤더 */}
                            <div className="px-5 py-2 sticky top-0 bg-[#F8F9FA]/95 backdrop-blur-sm z-10 border-b border-gray-100">
                                <span className="text-xs font-bold text-[#868E96]">
                                    {format(dateObj, 'M월 d일')}
                                </span>
                            </div>

                            {/* 해당 날짜 내역들 */}
                            <div className="flex flex-col bg-white divide-y divide-gray-50">
                                {txs.map((tx) => {
                                    const txTime = parseISO(tx.transaction_date);
                                    const isCancel = false;

                                    return (
                                        <div 
                                            key={tx.id} 
                                            className="flex items-center justify-between px-5 py-4 active:bg-[#E0F7FA] transition-colors cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* 카테고리 아이콘 */}
                                                {getCategoryIcon(tx.merchant_name)}
                                                
                                                <div className="flex flex-col gap-0.5">
                                                    {/* 가맹점 이름 */}
                                                    <span className={cn("text-[15px] font-medium text-[#343A40]", isCancel && "text-[#ADB5BD] line-through")}>
                                                        {tx.merchant_name}
                                                    </span>
                                                    {/* 시간 */}
                                                    <span className="text-[11px] font-normal text-[#ADB5BD]">
                                                        {format(txTime, 'HH:mm')}
                                                        {isCancel && <span className="text-[#FF6F61] ml-1">취소</span>}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-0.5">
                                                {/* 결제 금액 */}
                                                <span className={cn("text-[15px] font-bold", isCancel ? "text-[#ADB5BD] line-through" : "text-[#343A40]")}>
                                                    {tx.amount_krw.toLocaleString()}원
                                                </span>
                                                {/* 할인 금액 (혜택) */}
                                                {!isCancel && tx.discount_amount && tx.discount_amount > 0 ? (
                                                    <span className="text-[11px] font-bold text-[#45B7D1]">
                                                        {tx.discount_amount.toLocaleString()}원 할인
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="flex flex-col items-center justify-center py-24 text-[#ADB5BD]">
                    <SearchX className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-sm">이번 달 거래 내역이 없습니다.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CardTransaction;