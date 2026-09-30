import { client } from './client';


// [추가] Wallet.tsx에서 사용할 타입 정의
export interface PayRequest {
  user_asset_id: number;
  amount: number;
  merchant_name: string;
  benefit_id?: number;
  discount_amount?: number;
}

export interface PayResponse {
  transaction_id: number;
  merchant: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface EarnPointRequest {
  benefit_id: number;
  amount: number;
  description: string;
}

export interface PointBalanceResponse {
  user_id: number;
  total_point: number;
  earn_count: number;
}

// 데이터 타입 정의 (백엔드 모델과 일치)
export interface TransactionItem {
  id: number;
  transaction_id: string;
  user_id: number;
  card_id: number;
  amount_krw: number;
  merchant_name: string;
  transaction_date: string; // ISO 8601 String
  card_company?: string;
  installment_months?: number;

  // [추가] 할인 금액 (Optional)
  discount_amount?: number;
}

export const transactionApi = {
  // 결제 (Wallet.tsx)
  pay: async (data: PayRequest) => {
    const response = await client.post<PayResponse>('/transactions/pay', data);
    return response.data;
  },

  // 포인트 적립 (Wallet.tsx - 기존 fetch('http://127.0.0.1:8000/api/points/earn') 대체)
  earnPoint: async (data: EarnPointRequest) => {
    const response = await client.post('/points/earn', data);
    return response.data;
  },

  // 포인트 잔액 조회
  getPointBalance: async () => {
    const response = await client.get<PointBalanceResponse>('/points/balance');
    return response.data;
  },
  // [핵심] 특정 카드의 월별 거래 내역 조회
  // GET /api/v1/transactions/history/13?year=2025&month=12
  getCardHistory: async (cardId: number | string, year: number, month: number) => {
    const response = await client.get<TransactionItem[]>(`/transactions/history/${cardId}`, {
      params: { year, month }
    });
    return response.data;
  },
};