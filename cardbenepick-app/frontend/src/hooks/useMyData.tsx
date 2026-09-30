import { useState, useEffect } from 'react';
import { mlApi, PredictionResponse, FeedbackPayload, SurveyResult } from '@/api/ml'; 
import { toast } from '@/components/ui/use-toast'; 
import { useUserStore } from '@/store/useUserStore';
import { useNavigate } from 'react-router-dom'; // navigate 추가

// Cold Start의 useML 훅과의 반환 타입 일치를 위해 수정
interface MyDataMLReturn {
    loading: boolean;
    error: string | null;
    predictionResult: PredictionResponse | null;
    // Cold Start 시그니처를 포함하도록 submitResult 타입을 확장했습니다.
    submitResult: ((clusterId: number, feedback?: 'good' | 'bad', comment?: string) => Promise<void>) | null; 
    candidates: any[] | null; 
    selectedCluster: number;
    setSelectedCluster: (id: number) => void;
}

/**
 * 로그인 사용자의 ID를 기반으로 MyData 예측 API를 호출하고 결과를 반환하는 훅.
 * SurveyComplete 페이지에서 MyData 플로우일 때 사용됩니다.
 */
export const useMyDataML = (userId: string | number | null | undefined, enabled: boolean): MyDataMLReturn => {
    const { user } = useUserStore();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null);
    const [selectedCluster, setSelectedCluster] = useState<number>(0); 

    useEffect(() => {
        if (!enabled || !userId) {
            setLoading(false);
            return;
        }

        const runPrediction = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const data = await mlApi.predictMydata(userId);
                
                if (data.status === 'success') {
                    setPredictionResult(data);
                    setSelectedCluster(data.predicted_cluster); // 초기 예측 클러스터 설정
                } else {
                    setError('MyData 예측 서버에서 오류가 발생했습니다.');
                    toast({ title: "예측 오류", description: "서버가 예측에 실패했습니다.", variant: "destructive" });
                }
            } catch (err) {
                console.error("❌ [MyData ML Hook] 예측 실패:", err);
                // 404 에러 처리는 SurveyComplete에서 진행한다고 가정합니다.
                setError('분석 서버 연결에 실패했습니다.'); 
            } finally {
                setLoading(false);
            }
        };

        runPrediction();
        
    }, [userId, enabled]);

    // MyData 예측 결과 제출 (피드백 건너뛰고 바로 RAG 요청)
    // Cold Start의 submitResult와 타입 통일을 위해 submitResult로 이름 변경
    const submitResult = async (clusterId: number, feedback?: 'good' | 'bad', comment?: string) => {
        if (!predictionResult) return;
        
        // MyData는 설문조사 결과가 없으므로 빈 배열 사용
        const userCategories: string[] = []; 
        const currentUserId = user?.user_id ? String(user.user_id) : 'guest_user_id';
        
        const preferencePayload = {
            user_id: currentUserId,
            cluster_id: clusterId,
            preferred_categories: userCategories,
            timestamp: new Date().toISOString()
        };

        console.log("📤 [MyData Hook] RAG 추천 요청:", preferencePayload);
        
        try {
            // (1) RAG 요청 및 결과 받기
            const responseData = await mlApi.saveUserPreference(preferencePayload);
            
            // (2) 추천 페이지로 이동
            navigate('/recommendations', { 
                state: { 
                    cluster: clusterId,
                    recommendationData: responseData
                } 
            });
        } catch (e) {
            console.error("❌ [MyData Hook] RAG 추천 요청 실패:", e);
            toast({
                title: "추천 실패",
                description: "마이데이터 기반 추천 정보를 불러오는 중 오류가 발생했습니다.",
                variant: "destructive",
            });
            throw e; // 호출한 컴포넌트(SurveyComplete)에서 isSubmitting 복구를 위해 에러를 던져줌
        }
    };
    
    return {
        loading,
        error,
        predictionResult,
        submitResult: submitResult, // ★ FIX: isMyDataFlow 조건 제거
        candidates: predictionResult?.ranking || null, 
        selectedCluster,
        setSelectedCluster
    };
};