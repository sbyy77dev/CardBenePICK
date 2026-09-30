import { client } from './client';

export interface CardBenefit {
  benefit_id: number;
  category: string;
  summary: string;
  detail: any;
}

export interface BenefitSum {
  user_id: number;
  benefit_id: string;
  day_amount: number;
  day_count: number;

  week_amount: number;
  week_count: number;

  month_amount: number;
  month_count: number;

  year_amount: number;
  year_count: number;
}

export interface CardMaster {
  card_id: number;
  card_name: string;
  card_img_url?: string;
  institution_name?: string; // 추가 필드
}

export const cardApi = {
  // 내 카드(자산) 목록 조회
  getMyCards: async () => {
    const response = await client.get<CardMaster[]>('/assets/');
    return response.data;
  },
  
  // 전체 카드 목록 조회
  getAllCards: async () => {
    const response = await client.get<CardMaster[]>('/assets/');
    return response.data;
  },

  // [신규] 카드 상세 정보 조회
  // 백엔드에 상세 조회 API(/assets/{id})가 있다면 그걸 쓰고, 없다면 목록에서 찾습니다.
  // 여기서는 안전하게 목록을 가져와서 찾는 방식으로 구현합니다.
  getCardDetail: async (cardId: string) => {
    // 1. 만약 백엔드에 상세 API가 있다면:
    // const response = await client.get<CardMaster>(`/assets/${cardId}`);
    // return response.data;

    // 2. 현재 백엔드 구조상 목록에서 필터링:
    const response = await client.get<CardMaster[]>('/assets/');
    const card = response.data.find(c => 
      c.card_id.toString() === cardId || 
      c.card_name === cardId // 이름으로 검색하는 경우 대비
    );
    
    if (!card) {
      throw new Error("Card not found");
    }
    return card;
  }
};