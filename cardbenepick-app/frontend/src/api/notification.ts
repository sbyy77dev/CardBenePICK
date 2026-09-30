import { client } from './client';
import { Notification } from '@/types';

export const notificationApi = {
  // 알림 목록 조회
  getNotifications: async () => {
    const response = await client.get<Notification[]>('/notifications/');
    return response.data;
  },
};