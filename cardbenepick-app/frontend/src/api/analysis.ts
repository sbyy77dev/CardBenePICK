import { client } from './client';

export interface CardPerformanceData {
  card_id: string;
  card_name: string;
  card_company: string;
  current_usage: number;
  last_month_usage: number;
  requirement: number;
  image_filename: string;
}

// [추가] 거래 내역 타입 정의
export interface Transaction {
  id: number;
  amount_krw: number;
  merchant_name: string;
  category?: string;
  card_id: number;
  transaction_date: string;
}

export const analysisApi = {
  // 실시간 카드 실적 조회
  getRealtimePerformance: async () => {
    const response = await client.get<CardPerformanceData[]>('/analysis/realtime-cards');
    return response.data;
  },

  // [추가] 월별 소비 내역(캘린더) 조회
  getMonthlyCalendar: async (year: number, month: number) => {
    const response = await client.get<Transaction[]>('/analysis/calendar', {
      params: { year, month },
    });
    return response.data;
  },
};