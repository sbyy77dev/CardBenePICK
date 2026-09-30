import { useQuery } from '@tanstack/react-query';
import { cardApi } from '@/api/card';

export const useCardDetail = (cardId?: string) => {
  return useQuery({
    queryKey: ['cardDetail', cardId],
    queryFn: () => {
      if (!cardId) throw new Error("Card ID is required");
      return cardApi.getCardDetail(cardId);
    },
    enabled: !!cardId, // cardId가 있을 때만 실행
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
  });
};