import { useState, useEffect } from 'react';
import { mlApi, SurveyResult, PredictionResponse, FeedbackPayload } from '@/api/ml';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/useUserStore'; // 로그인 상태 확인용

export interface Candidate {
  cluster: number;
  score: number;
}

export const useML = (surveyResult: SurveyResult | null) => {
  const navigate = useNavigate();
  // [사용] 로그인 상태 확인
  const { isLoggedIn, user } = useUserStore(); 

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [apiResponse, setApiResponse] = useState<PredictionResponse | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<number>(0);

  // 1. 초기 분석 (ML 예측) - 로직은 기존과 동일
  useEffect(() => {
    // ... (분석 로직 생략, 이전과 동일) ...
    const analyze = async () => {
      if (!surveyResult) {
        setError('설문 데이터가 없습니다.');
        setLoading(false);
        return;
      }

      try {
        const data = await mlApi.predictCluster(surveyResult);
        
        const rawList = data.ranking || data.candidates || [];
        let normalizedList: Candidate[] = rawList.map((item: any) => ({
            cluster: item.cluster,
            score: item.probability !== undefined ? item.probability : (item.score || 0)
        }));

        if (normalizedList.length === 0) {
            const allClusters = [0, 1, 2, 3, 4];
            normalizedList.push({ cluster: data.predicted_cluster, score: data.confidence_score || 0.85 });
            allClusters.forEach(id => {
                if (id !== data.predicted_cluster) normalizedList.push({ cluster: id, score: 0.05 });
            });
        }
        normalizedList.sort((a, b) => b.score - a.score);

        setTimeout(() => {
            setApiResponse(data);
            setCandidates(normalizedList);
            setSelectedCluster(data.predicted_cluster);
            setLoading(false);
        }, 1500);

      } catch (err) {
        console.error("❌ [Analysis Hook] ML 예측 실패:", err);
        setError('분석 서버와 연결할 수 없습니다.');
        setLoading(false);
      }
    };

    analyze();
  }, [surveyResult]);


  // 2. 최종 제출 및 라우팅 처리
  const submitResult = async (
    feedback: 'good' | 'bad',
    comment: string
  ) => {
    if (!apiResponse) return;

    // (A) ML 피드백 전송 (공통)
    const feedbackPayload: FeedbackPayload = {
        request_id: apiResponse.request_id,
        predicted_cluster: apiResponse.predicted_cluster,
        confidence_score: apiResponse.confidence_score,
        is_correct: feedback === 'good',
        corrected_cluster: selectedCluster,
        comment: comment.trim() || (feedback === 'good' ? "사용자 동의" : "사용자 수정")
    };
    try {
        await mlApi.sendFeedback(feedbackPayload);
    } catch (e) {
        console.warn("ML 피드백 전송 실패 (무시):", e);
    }

    // (B) [핵심 분기] 로그인 상태 확인 후 라우팅
    if (!isLoggedIn) {
        // 비로그인 -> 로그인 페이지로 이동
        console.log("🔒 비로그인 사용자 -> 로그인 페이지로 이동");
        
        navigate('/login', { 
            state: { 
                message: "맞춤 카드를 보려면 로그인이 필요합니다.",
                surveyResult, 
                clusterId: selectedCluster 
            } 
        });
        return;
    }

    // (C) 로그인 상태 -> RAG 추천 결과 요청 및 이동
    try {
        const userCategories = surveyResult?.preferredCategories || [];
        // user_id가 숫자 타입(1)일 가능성이 높으므로, 문자열로 명시적 변환합니다.
        const currentUserId = user?.user_id ? String(user.user_id) : 'guest_user_id';
        
        const preferencePayload = {
            // 로그인 상태이므로 user store에서 ID를 가져옴
            user_id: currentUserId,
            cluster_id: selectedCluster,
            preferred_categories: userCategories,
            timestamp: new Date().toISOString()
        };

        console.log("📤 [Analysis Hook] 백엔드 추천 요청:", preferencePayload);
        const responseData = await mlApi.saveUserPreference(preferencePayload);
        console.log("📥 [Analysis Hook] 추천 결과 수신:", responseData);

        // [수정!] mlApi.saveUserPreference에서 이미 .recommendation을 추출했으므로 
        // responseData는 LLM 결과 JSON 자체입니다.
        // 기존 코드를 유지합니다. (ml.ts에서 수정했기 때문)
        navigate('/recommendations', { 
            state: { 
                cluster: selectedCluster,
                recommendationData: responseData // <-- LLM 결과 JSON
            } 
        });

    } catch (e) {
        // [수정!] 상세 에러 정보 로깅 추가
        if (e.response && e.response.status === 422) {
            console.error("🚨 422 Validation Error Details:", e.response.data);
        }
        console.error("❌ [Analysis Hook] 추천 요청 실패:", e);
        throw new Error("추천 정보를 불러오는 중 오류가 발생했습니다.");
    }
  };

  return {
    loading,
    error,
    apiResponse,
    candidates,
    selectedCluster,
    setSelectedCluster,
    submitResult
  };
};