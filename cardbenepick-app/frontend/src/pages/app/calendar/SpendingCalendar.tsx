import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, 
  ShoppingBag, Coffee, Bus, Fuel, Utensils, ShoppingCart, Smartphone, Ticket, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  format, parseISO, isSameDay, getDay, getDate, 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isToday 
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// [변경] Hook 및 타입 임포트
import { useMonthlyTransactions } from '@/hooks/useAnalysis';
import { Transaction } from '@/api/analysis';

// // --- 아이콘 매핑 ---
// const getCategoryIcon = (merchantName: string) => {
//   const name = merchantName.toLowerCase();
//   // 아이콘 스타일을 조금 더 심플하게 변경 (구분선 스타일에 맞춤)
//   const style = "w-5 h-5 text-white";
  
//   if (name.includes('스타벅스') || name.includes('카페')) return <div className="bg-green-500 p-2.5 rounded-full shadow-sm"><Coffee className={style} /></div>;
//   if (name.includes('편의점') || name.includes('마트')) return <div className="bg-blue-500 p-2.5 rounded-full shadow-sm"><ShoppingCart className={style} /></div>;
//   if (name.includes('택시') || name.includes('교통') || name.includes('지하철')) return <div className="bg-yellow-500 p-2.5 rounded-full shadow-sm"><Bus className={style} /></div>;
//   if (name.includes('주유')) return <div className="bg-slate-600 p-2.5 rounded-full shadow-sm"><Fuel className={style} /></div>;
//   if (name.includes('식당') || name.includes('음식') || name.includes('버거')) return <div className="bg-orange-500 p-2.5 rounded-full shadow-sm"><Utensils className={style} /></div>;
//   if (name.includes('통신')) return <div className="bg-purple-500 p-2.5 rounded-full shadow-sm"><Smartphone className={style} /></div>;
//   if (name.includes('넷플릭스') || name.includes('영화')) return <div className="bg-red-500 p-2.5 rounded-full shadow-sm"><Ticket className={style} /></div>;
  
//   return <div className="bg-gray-400 p-2.5 rounded-full shadow-sm"><ShoppingBag className={style} /></div>;
// };

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


// --- 요일 텍스트 ---
const getDayKo = (dateStr: string) => {
  const day = getDay(parseISO(dateStr));
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[day];
};

type TransactionResponse = {
  id: number;
  amount_krw: number;
  merchant_name: string;
  card_issuer_name?: string;
  transaction_date: string;
};


const SpendingCalendar = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // [변경] React Query Hook 사용
  // useMonthlyTransactions는 이미 analysisApi.getMonthlyCalendar를 호출하도록 구현되어 있음
  const { 
    data: rawTransactions = [], 
    isLoading 
  } = useMonthlyTransactions(currentMonth.getFullYear(), currentMonth.getMonth() + 1);

  // [변경] 데이터 포맷팅 (useMemo로 최적화)
  // API 응답(Transaction[])을 UI용 포맷으로 변환
  const transactions = useMemo(() => {
    return rawTransactions.map((tx: Transaction) => {
      const dateObj = new Date(tx.transaction_date);
      return {
        id: tx.id.toString(),
        amount: tx.amount_krw,
        merchant: tx.merchant_name,
        // card_company 정보가 API 응답에 없다면 기본값 처리 (필요시 백엔드 스키마 수정)
        card_company: '카드', 
        date: tx.transaction_date.split('T')[0],
        time: dateObj.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
      };
    });
  }, [rawTransactions]);

  const totalExpense = useMemo(() => transactions.reduce((acc, curr) => acc + curr.amount, 0), [transactions]);
  
  const groupedTransactions = useMemo(() => {
    const grouped: Record<string, typeof transactions> = {};
    const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    sorted.forEach(tx => {
      if (!grouped[tx.date]) grouped[tx.date] = [];
      grouped[tx.date].push(tx);
    });
    return grouped;
  }, [transactions]);

  const dailyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    transactions.forEach(tx => {
      totals[tx.date] = (totals[tx.date] || 0) + tx.amount;
    });
    return totals;
  }, [transactions]);

  const selectedDayTransactions = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return transactions.filter(t => t.date === dateStr);
  }, [selectedDate, transactions]);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const calendarWeeks = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    allDays.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    return weeks;
  }, [currentMonth]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-gray-500 text-sm">소비 내역을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white w-full"> 
      
      {/* --- Header --- */}
      <div className="flex items-center p-4 bg-white sticky top-0 z-30 border-b border-gray-50">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)} 
          className="mr-3 hover:bg-gray-50"
        >
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900">가계부</h1>
      </div>

      {/* --- 상단 월 네비게이션 & 요약 --- */}
      <div className="px-6 pb-2 bg-white z-20 pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            <span className="text-2xl font-extrabold text-gray-900 mr-2">
              {currentMonth.getMonth() + 1}월
            </span>
            <div className="flex bg-gray-100 rounded-full p-0.5">
              <button onClick={prevMonth} className="p-1 hover:bg-white rounded-full transition-all shadow-sm"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
              <button onClick={nextMonth} className="p-1 hover:bg-white rounded-full transition-all shadow-sm"><ChevronRight className="w-4 h-4 text-gray-600" /></button>
            </div>
          </div>
          <div className="text-right">
             <p className="text-xs text-gray-500 font-medium mb-0.5">총 지출</p>
             <p className="text-lg font-bold text-gray-900">{totalExpense.toLocaleString()}원</p>
          </div>
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="flex-1 overflow-y-auto pb-32">
        
        {/* [VIEW 1] 리스트 모드 (구분선 스타일 적용) */}
        {viewMode === 'list' && (
          <div className="animate-in fade-in duration-300">
            {Object.keys(groupedTransactions).length > 0 ? (
              Object.entries(groupedTransactions).map(([dateStr, txs]) => {
                const daySum = txs.reduce((acc, curr) => acc + curr.amount, 0);
                const dateObj = parseISO(dateStr);
                
                return (
                  <div key={dateStr} className="mb-2">
                    {/* 날짜 헤더 */}
                    <div className="flex justify-between items-center px-6 py-4 bg-gray-50/50 border-t border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-600">
                        {getDate(dateObj)}일 {getDayKo(dateStr)}요일
                      </span>
                      <span className="text-sm font-bold text-gray-900">-{daySum.toLocaleString()}원</span>
                    </div>

                    {/* 내역 리스트 */}
                    <div className="px-6">
                      {txs.map((tx) => (
                        <div 
                          key={tx.id} 
                          className="flex items-center justify-between py-4 border-b border-gray-100 last:border-none"
                        >
                          <div className="flex items-center gap-4">
                            {getCategoryIcon(tx.merchant)}
                            <div>
                              <div className="font-bold text-gray-900 text-[16px]">{tx.merchant}</div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                {tx.card_company} | {tx.time}
                              </div>
                            </div>
                          </div>
                          <div className="font-bold text-gray-900 text-[16px]">
                            -{tx.amount.toLocaleString()}원
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <ShoppingBag className="w-12 h-12 mb-4 opacity-20" />
                <p>이번 달 내역이 없습니다.</p>
              </div>
            )}
          </div>
        )}

        {/* [VIEW 2] 캘린더 모드 */}
        {viewMode === 'calendar' && (
          <div className="flex flex-col h-full animate-in fade-in duration-300">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 text-center py-2 bg-white mb-2 border-b border-gray-100">
              {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                <span key={i} className={cn("text-xs font-normal", i === 0 ? "text-red-500" : "text-gray-400")}>
                  {day}
                </span>
              ))}
            </div>

            {/* 달력 본문 */}
            <div className="flex flex-col">
              {calendarWeeks.map((week, weekIndex) => {
                const weeklyTotal = week.reduce((sum, day) => {
                  if (!isSameMonth(day, currentMonth)) return sum;
                  const dateKey = format(day, 'yyyy-MM-dd');
                  return sum + (dailyTotals[dateKey] || 0);
                }, 0);

                return (
                  <div key={weekIndex} className="mb-2">
                    <div className="grid grid-cols-7">
                      {week.map((day, dayIndex) => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const dayAmount = dailyTotals[dateKey] || 0;
                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isTodayDate = isToday(day);

                        return (
                          <div 
                            key={dayIndex}
                            onClick={() => setSelectedDate(day)}
                            className={cn(
                              "min-h-[70px] flex flex-col items-center justify-start pt-2 pb-1 relative cursor-pointer rounded-lg transition-all mx-0.5",
                              isSelected 
                                ? "bg-blue-50" 
                                : "hover:bg-gray-50",
                            )}
                          >
                            <span className={cn(
                              "text-sm w-7 h-7 flex items-center justify-center rounded-full mb-1",
                              isTodayDate ? "bg-slate-800 text-white font-bold" : 
                              isSelected ? "text-blue-600 font-bold" : 
                              dayIndex === 0 ? "text-red-500" : "text-gray-700",
                              !isCurrentMonth && "text-gray-300"
                            )}>
                              {getDate(day)}
                            </span>

                            {dayAmount > 0 && isCurrentMonth && (
                              <span className={cn(
                                "text-[10px] font-bold tracking-tight text-blue-600",
                                !isCurrentMonth && "opacity-30"
                              )}>
                                -{dayAmount >= 10000 ? `${(dayAmount/10000).toFixed(0)}만` : `${(dayAmount/1000).toFixed(0)}천`}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="w-full bg-gray-50 py-2 px-4 flex justify-end items-center mt-1 mb-2">
                      <span className="text-xs text-gray-500 mr-2">
                        {weekIndex + 1}주 합계
                      </span>
                      <span className={cn("text-sm font-bold", weeklyTotal > 0 ? "text-gray-900" : "text-gray-300")}>
                        -{weeklyTotal.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 선택 날짜 상세 리스트 (하단) */}
            <div className="px-6 py-4 bg-white min-h-[200px] border-t-8 border-gray-50 mt-2">
              {selectedDate ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center pb-4 mb-2 border-b border-gray-100">
                    <h3 className="text-base font-bold text-gray-900">
                      {format(selectedDate, 'd일 EEEE', { locale: ko })}
                    </h3>
                    {(dailyTotals[format(selectedDate, 'yyyy-MM-dd')] || 0) > 0 && (
                      <span className="text-blue-600 font-bold text-lg">
                        -{dailyTotals[format(selectedDate, 'yyyy-MM-dd')].toLocaleString()}원
                      </span>
                    )}
                  </div>
                  
                  {selectedDayTransactions.length > 0 ? (
                    selectedDayTransactions.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-none">
                        <div className="flex items-center gap-4">
                          {getCategoryIcon(tx.merchant)}
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{tx.merchant}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{tx.time} | {tx.card_company}</p>
                          </div>
                        </div>
                        <p className="font-bold text-gray-900 text-sm">-{tx.amount.toLocaleString()}원</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      지출 내역이 없습니다.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">날짜를 선택해주세요.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- 하단 플로팅 탭 --- */}
      <div className="fixed bottom-20 left-0 right-0 flex justify-center z-30 pointer-events-none">
        <div className="bg-slate-800 text-white rounded-full p-1.5 flex shadow-2xl items-center pointer-events-auto transform transition-transform hover:scale-105">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "px-6 py-2.5 rounded-full text-sm font-bold transition-all",
              viewMode === 'list' 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-slate-400 hover:text-white"
            )}
          >
            내역
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={cn(
              "px-6 py-2.5 rounded-full text-sm font-bold transition-all",
              viewMode === 'calendar' 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-slate-400 hover:text-white"
            )}
          >
            달력
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpendingCalendar;