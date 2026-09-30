import { client } from './client';

export interface EarnPointRequest {
  benefit_id: number;
  amount: number;
  description: string;
}

export interface PointBalanceResponse {
  user_id: number;
  total_point: number;
  earn_count: number; // 사용 횟수 등으로 활용
}

export const pointApi = {
  // 포인트 적립
  earnPoint: async (data: EarnPointRequest) => {
    const response = await client.post('/points/earn', data);
    return response.data;
  },

  // 포인트 잔액 조회
  getBalance: async () => {
    const response = await client.get<PointBalanceResponse>('/points/balance');
    return response.data;
  }
};