import { client } from './client';
import axios from 'axios'; // ML/Agent 서버는 별도 인스턴스 또는 axios 직접 사용
import { UserIDRequest } from '@/types'; // UserIDRequest를 types/index.ts에서 가져오도록 수정
// [환경변수] ML 서버 주소
const ML_BASE_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:9000';
const AGENT_BASE_URL = import.meta.env.VITE_AGENT_API_URL || 'http://localhost:8090/agent'; // 필요시 사용


// 데이터 타입 정의
export interface SurveyResult {
  ageGroup: string;
  gender: string;
  lifeStage: string;
  monthlySpend: string;
  hasCar: string;
  diningFrequency: string;
  hasLeisure: string;
  hasEdu: string;
  hasHealth: string;
  preferredCategories: string[];
}

export interface PredictionResponse {
  status: string;
  request_id: string;
  predicted_cluster: number;
  confidence_score: number;
  ranking?: { cluster: number; probability: number }[];
  candidates?: { cluster: number; score: number }[];
}

export interface FeedbackPayload {
  request_id: string;
  predicted_cluster: number;
  confidence_score: number;
  is_correct: boolean;
  corrected_cluster: number;
  comment: string;
}
// [기존] 추천 결과 타입 (LLM의 내부 JSON 구조)
export interface RecommendationResult { // 이름을 변경하여 LLM 결과 구조임을 명확히 합니다.
    recommendation_summary: {
        recommended_card: string;
        selection_reason: string;
    };
    card_comparison_list: {
        card_name: string;
        reason: string;
    }[];
}

// [추가] Agent 서버의 최상위 응답 구조를 정의합니다.
// 이 타입이 axios.post의 Generic 타입으로 사용되어야 합니다.
export interface AgentResponse {
    status: string;
    message: string;
    received_data: any; // 사용하지 않으므로 any로 처리
    recommendation: RecommendationResult; // 핵심! LLM 결과가 이 키 아래에 있습니다.
}


export const mlApi = {
  // 1. ML 서버: 클러스터 예측
  predictCluster: async (surveyResult: SurveyResult) => {
    const payload = {
      AGE: surveyResult.ageGroup || "25",
      SEX_CD: Number(surveyResult.gender || 1),
      LIFE_STAGE: surveyResult.lifeStage || "UNI",
      Q_SPEND: surveyResult.monthlySpend || "1_Low",
      Q_CAR: surveyResult.hasCar || "No",
      Q_DINING: surveyResult.diningFrequency || "1_Low",
      Q_LEISURE: surveyResult.hasLeisure || "No",
      Q_EDU: surveyResult.hasEdu || "No",
      Q_HEALTH: surveyResult.hasHealth || "No",
    };
    
    const response = await axios.post<PredictionResponse>(`${ML_BASE_URL}/predict`, payload);
    return response.data;
  },

  // [새로 추가] 1-2. ML 서버: 마이데이터 기반 클러스터 예측
  predictMydata: async (userId: string | number) => {
    const payload: UserIDRequest = { user_id: Number(userId) }; // API는 user_id를 숫자로 기대
    const url = `${ML_BASE_URL}/predict/mydata`; // ★ 경로 복원 (/ml 제거)

        // ★ 디버깅을 위한 로깅 추가
        console.log(`[ML API] 📤 MyData Prediction URL: ${url}`);
        console.log('[ML API] 📤 MyData Prediction Payload:', payload);
      // POST http://localhost:9000/predict/mydata
      const response = await axios.post<PredictionResponse>(
          `${ML_BASE_URL}/predict/mydata`, 
          payload
      );
      return response.data; // PredictionResponse 타입 반환
  },

  // 2. ML 서버: 피드백 전송
  sendFeedback: async (payload: FeedbackPayload) => {
    await axios.post(`${ML_BASE_URL}/feedback`, payload);
  },

  // 3. 메인 백엔드 (Agent 연동): 사용자 선호도 저장 및 카드 추천 요청
    saveUserPreference: async (data: {
        cluster_id: number;
        preferred_categories: string[];
        timestamp: string;
    }) => {
        
        // [수정: AgentResponse 타입을 사용]
        const response = await axios.post<AgentResponse>(
            `${AGENT_BASE_URL}/api/ml/preferences`, 
            data
        );
        
         // Agent 서버의 응답 (response.data) 내부에서 'recommendation' 키를 추출
         // 이제 'recommendation'이 AgentResponse 타입에 정의되어 있어 오류가 해결됩니다.
         return response.data.recommendation; // 반환 타입은 RecommendationResult
    }
};
