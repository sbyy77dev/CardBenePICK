import { useQuery } from '@tanstack/react-query';
import { analysisApi } from '@/api/analysis';

export const useCardPerformance = () => {
  return useQuery({
    queryKey: ['cardPerformance'], // 캐싱 키
    queryFn: analysisApi.getRealtimePerformance,
    staleTime: 1000 * 60 * 5, // 5분간 데이터 신선함 유지 (선택 사항)
  });
};
// [추가] 월별 거래 내역 훅
export const useMonthlyTransactions = (year: number, month: number) => {
  return useQuery({
    queryKey: ['monthlyTransactions', year, month], // 연/월이 바뀌면 다시 조회
    queryFn: () => analysisApi.getMonthlyCalendar(year, month),
    staleTime: 1000 * 60 * 10, // 10분 캐싱
  });
};
