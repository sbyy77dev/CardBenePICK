import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '@/api/notification';

export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: notificationApi.getNotifications,
    // 알림은 자주 확인하므로 staleTime을 짧게 가져가거나 0으로 설정
    staleTime: 1000 * 60 * 1, // 1분
  });
};