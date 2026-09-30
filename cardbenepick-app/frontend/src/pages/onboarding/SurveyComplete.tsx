import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, ThumbsUp, ThumbsDown, ArrowRight, RefreshCw, AlertCircle, HelpCircle, Check, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
// 기존 useML 훅을 사용합니다.
import { useML } from '@/hooks/useML'; 
import { useMyDataML } from '@/hooks/useMyData'; // 새로 추가된 MyData 전용 훅
import { useUserStore } from '@/store/useUserStore'; 
import { SurveyResult, PredictionResponse, FeedbackPayload } from '@/api/ml'; // 필요한 타입 임포트
import { toast } from '@/components/ui/use-toast'; // ★ FIX: toast 함수 임포트 추가

// MyData 예측을 위한 Location State 타입 정의
interface LocationState {
    surveyResult?: SurveyResult; // Cold Start 결과
    predictionType?: 'mydata'; // MyData 플로우 플래그
}

// ---------------------------------------------------------------------
// UI 컴포넌트: SurveyComplete
// ---------------------------------------------------------------------

const SurveyComplete = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useUserStore(); // 로그인 사용자 정보

    // 플로우 감지: MyData 플로우인지, 아니면 Survey 결과 제출 플로우인지 판단
    const isMyDataFlow = location.state?.predictionType === 'mydata';

    // 1. 데이터/훅 분기
    let coldStartSurveyResult: SurveyResult | null = null;
    let myDataUserId: string | number | null | undefined = undefined; 

    if (!isMyDataFlow) {
        coldStartSurveyResult = location.state?.surveyResult as SurveyResult | null;
    } else {
        // ★ FIX: user?.user_id 대신 user?.id를 사용하도록 수정합니다. (userStore의 표준 key를 따름)
        myDataUserId = user?.user_id; 
    }
    
    // 유효한 user ID가 있는지 확인합니다. (null, undefined, 빈 문자열/숫자 0 제외)
    const isUserIdValid = !!myDataUserId && myDataUserId !== '0' && myDataUserId !== 0;
    
    // user 객체가 로드되었는지 확인하는 상태. (useUserStore 구현에 따라 다를 수 있으나, 일단 user가 undefined가 아님을 체크)
    const isUserLoaded = user !== undefined; 

    // A. Cold Start Hook 
    const coldStartHooks = useML(coldStartSurveyResult);
    
    // B. MyData Hook 
    // user 정보 로드가 완료되고, ID도 유효할 때만 훅 실행
    const myDataHooks = useMyDataML(myDataUserId, isMyDataFlow && isUserIdValid && isUserLoaded);

    // 2. 최종 결과 합치기
    const finalResult = useMemo(() => {
        if (isMyDataFlow) {
            // MyData 플로우: myDataHooks의 결과를 사용
            return {
                // user 정보 로드 중이면 로딩 상태로 처리
                loading: myDataHooks.loading || !isUserLoaded, 
                // ID가 유효하지 않으면 에러 메시지 반환
                error: myDataHooks.error || (!isUserIdValid && isUserLoaded ? "로그인 정보가 유효하지 않습니다." : null), 
                apiResponse: myDataHooks.predictionResult,
                candidates: myDataHooks.candidates, 
                selectedCluster: myDataHooks.selectedCluster,
                submitResult: myDataHooks.submitResult, 
                setSelectedCluster: myDataHooks.setSelectedCluster
            };
        } else {
            // Cold Start 플로우: coldStartHooks의 결과를 사용 (기존 로직)
            return {
                loading: coldStartHooks.loading,
                error: coldStartHooks.error,
                apiResponse: coldStartHooks.apiResponse,
                candidates: coldStartHooks.candidates,
                selectedCluster: coldStartHooks.selectedCluster,
                submitResult: coldStartHooks.submitResult, 
                setSelectedCluster: coldStartHooks.setSelectedCluster
            };
        }
    }, [isMyDataFlow, isUserIdValid, isUserLoaded, coldStartHooks, myDataHooks]);

    useEffect(() => {
                // candidates를 콘솔에 찍기
                console.log("Candidates:", myDataHooks.candidates);
            }, [myDataHooks.candidates]);  // candidates가 변경될 때마다 로그를 찍음

    // 3. UI 상태 (Cold Start 및 MyData 피드백 공통)
    const [feedback, setFeedback] = useState<'good' | 'bad' | null>(null);
    const [openDescId, setOpenDescId] = useState<number | null>(null);
    const [userComment, setUserComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const topRef = useRef<HTMLDivElement>(null);
    
    // 최종 상태 변수
    const { loading, error, apiResponse, candidates, selectedCluster, submitResult, setSelectedCluster } = finalResult;

    // 핸들러: 최종 제출 (Cold Start와 MyData 공통 처리)
    const handleSubmit = async () => {
        // submitResult는 MyData flow에서 (clusterId)를, Cold Start flow에서 (feedback, comment)를 받습니다.
        if (!feedback || !apiResponse || !submitResult || !setSelectedCluster) return; 

        setIsSubmitting(true);
        try {
            if (isMyDataFlow) {
                // MyData 플로우: RAG 요청을 위해 선택된 클러스터 ID만 전달
                // useMyDataML.tsx의 submitResult는 (clusterId)를 받도록 되어 있습니다.
                // TypeScript 오류를 피하기 위해 타입 단언(as any)을 사용합니다.
                await (submitResult as (clusterId: number) => Promise<void>)(selectedCluster); 
            } else {
                // Cold Start 플로우: 피드백 전송 및 RAG 요청
                // useML.tsx의 submitResult는 (feedback, comment)를 받습니다.
                await (submitResult as (feedback: 'good' | 'bad', comment: string) => Promise<void>)(feedback, userComment);
            }
        } catch (err) {
            toast({
                title: "제출 오류",
                description: err instanceof Error ? err.message : "오류가 발생했습니다.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false); 
        }
    };
    
    // 4. 에러 및 유효성 검사 리디렉션
    useEffect(() => {
        // MyData 플로우이면서 ID가 유효하지 않은 경우 (로드가 완료된 후)
        if (isMyDataFlow && isUserLoaded && !isUserIdValid && !loading) {
            toast({
                title: "로그인 오류",
                description: "유효한 사용자 정보를 찾을 수 없습니다. 설문조사로 이동합니다.",
                variant: "destructive",
            });
            const timer = setTimeout(() => navigate('/survey', { replace: true }), 1500);
            return () => clearTimeout(timer);
        }
        
        // MyData 에러 시 설문조사로 리디렉션
        if (isMyDataFlow && !loading && error && error !== "로그인 정보가 유효하지 않습니다.") {
            // MyData 예측 실패 (500 에러 등) 시 사용자에게 알리고 설문조사로 안내
            toast({
                title: "분석 실패",
                description: "마이데이터 분석 중 오류가 발생했습니다. 설문조사를 이용해 주세요.",
                variant: "destructive",
            });
            const timer = setTimeout(() => navigate('/survey', { replace: true }), 1500);
            return () => clearTimeout(timer);
        }
    }, [isMyDataFlow, loading, error, navigate, isUserIdValid, isUserLoaded]);

    // --- 클러스터 컨텐츠 (기존 유지) ---
    const getClusterContent = (clusterId: number) => {
        switch (clusterId) {
            case 0: return { title: "실속 미식가", eng: "Value Diner", emoji: "🥘", desc: "맛있는 외식과 건강 관리가 삶의 낙!\n하지만 낭비는 싫어하는 실속파입니다.", tag: "미식·건강", colorClass: "text-orange-600", bgClass: "bg-orange-50 border-orange-100" };
            case 1: return { title: "알뜰 소액족", eng: "Minimalist", emoji: "🪙", desc: "불필요한 지출은 절대 NO!\n꼭 필요한 곳에만 지갑을 여는 짠테크 고수.", tag: "절약·미니멀", colorClass: "text-emerald-600", bgClass: "bg-emerald-50 border-emerald-100" };
            case 2: return { title: "에듀 맘/대디", eng: "Edu-Focus", emoji: "🎓", desc: "자녀 교육비 지출이 압도적 1위!\n아이의 미래를 위해 아낌없이 투자하시네요.", tag: "자녀교육", colorClass: "text-indigo-600", bgClass: "bg-indigo-50 border-indigo-100" };
            case 3: return { title: "럭셔리 VIP", eng: "Affluent Lifestyle", emoji: "👑", desc: "외식, 여행, 레저까지!\n삶의 질을 높이는 데 아낌없는 여유로운 라이프.", tag: "프리미엄", colorClass: "text-purple-600", bgClass: "bg-purple-50 border-purple-100" };
            case 4: return { title: "마이카 중산층", eng: "Car Owner", emoji: "🚗", desc: "내 차와 함께라면 어디든!\n주유비와 차량 관리에 진심인 오너 드라이버.", tag: "드라이버", "colorClass": "text-blue-600", bgClass: "bg-blue-50 border-blue-100" };
        }
    };
    
    // 로딩 처리
    if (loading || (isMyDataFlow && !isUserLoaded)) return ( 
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center max-w-[480px] mx-auto">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
            <h2 className="text-xl font-bold text-foreground mb-2">
                {isMyDataFlow ? "마이데이터 기반 소비 성향을" : "AI가 소비 성향을"}<br/>분석하고 있습니다
            </h2>
            <p className="text-muted-foreground text-sm">잠시만 기다려 주세요...</p>
        </div>
    );
    
    // 에러 처리
    if (error) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center max-w-[480px] mx-auto">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate('/survey')} variant="outline">처음으로 돌아가기</Button>
        </div>
    );
    
    // API 응답이 없으면 에러 처리
    if (!apiResponse) {
         return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center max-w-[480px] mx-auto">
                <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                <p className="text-muted-foreground mb-6">분석 결과를 가져올 수 없습니다.</p>
                <Button onClick={() => navigate('/survey')} variant="outline">다시 시도하기</Button>
            </div>
        );
    }
    
    const predictedClusterId = apiResponse?.predicted_cluster ?? 0;
    const mainContent = getClusterContent(predictedClusterId);
    const mainScore = apiResponse?.confidence_score ?? 0;

    // ---------------------------------------------------------------------
    // Cold Start 및 MyData 공통 결과 표시 UI
    // ---------------------------------------------------------------------

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans text-foreground w-full max-w-[480px] mx-auto relative">
            <div ref={topRef} />

            <div className="flex-1 px-6 py-8 overflow-y-auto pb-40">
                
                {/* 상단 뱃지 */}
                <div className="flex justify-center mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-primary text-[11px] font-bold tracking-wider uppercase shadow-sm">
                        <Sparkles className="w-3 h-3" />
                        AI Analysis Complete
                    </span>
                </div>

                {/* 메인 결과 카드 (항상 고정) */}
                <div className="bg-card rounded-[2rem] p-8 shadow-card border border-border text-center mb-8 relative overflow-hidden animate-in zoom-in duration-500">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-indigo-500"></div>
                    <div className="text-6xl mb-4 cursor-default">{mainContent.emoji}</div>
                    <h1 className="text-2xl font-extrabold text-foreground mb-1 leading-tight">
                        당신은 <span className={cn("text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600")}>"{mainContent.title}"</span><br/>입니다
                    </h1>
                    <p className="text-xs text-muted-foreground font-medium mb-4 uppercase tracking-wide">{mainContent.eng}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line mb-6 font-medium">{mainContent.desc}</p>
                    <div className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-xl border border-border">
                        <span className="text-xs text-muted-foreground font-medium">분석 신뢰도</span>
                        <span className="text-sm font-bold text-foreground">{Math.round(mainScore * 100)}%</span>
                    </div>
                </div>

                {/* 피드백 버튼 */}
                <div className="mb-8">
                    <p className="text-center text-sm text-muted-foreground mb-4 font-medium">결과가 마음에 드시나요?</p>
                    <div className="flex gap-3 justify-center">
                        <button 
                            onClick={() => { 
                                setFeedback('good'); 
                                // useML의 setSelectedCluster가 selectedCluster를 업데이트합니다.
                                setSelectedCluster(predictedClusterId); 
                                setUserComment(''); // 좋아요 누르면 코멘트 초기화
                            }}
                            className={cn(
                                "flex-1 py-3.5 px-4 rounded-xl border text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2",
                                feedback === 'good' ? "bg-primary text-primary-foreground border-primary shadow-lg transform scale-105" : "bg-card text-muted-foreground border-border hover:bg-muted"
                            )}
                        >
                            <ThumbsUp className={cn("w-4 h-4", feedback === 'good' ? "fill-current" : "")} /> 네, 맞아요!
                        </button>

                        <button 
                            onClick={() => { setFeedback('bad'); }}
                            className={cn(
                                "flex-1 py-3.5 px-4 rounded-xl border text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2",
                                feedback === 'bad' ? "bg-slate-800 text-white border-slate-800 shadow-lg transform scale-105" : "bg-card text-muted-foreground border-border hover:bg-muted"
                            )}
                        >
                            <ThumbsDown className={cn("w-4 h-4", feedback === 'bad' ? "fill-current" : "")} /> 아닌 것 같아요
                        </button>
                    </div>
                </div>

                {/* [코멘트 입력창] 싫어요(bad)일 때 무조건 보이게 조건부 렌더링 */}
                {feedback === 'bad' && (
                    <div className="mb-10 animate-in slide-in-from-top-2 duration-300">
                        <label className="text-sm font-bold text-foreground mb-2 block flex items-center gap-1.5 ml-1">
                            <MessageSquare className="w-4 h-4 text-primary" />
                            어떤 점이 아쉬운가요? (선택)
                        </label>
                        <textarea
                            value={userComment}
                            onChange={(e) => setUserComment(e.target.value)}
                            placeholder="예: 혜택이 저랑 안 맞는 것 같아요. 저는 여행보다 쇼핑을 더 좋아해요."
                            className="w-full p-4 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none h-28 placeholder:text-muted-foreground shadow-sm"
                        />
                    </div>
                )}

                {/* 다른 후보 리스트 */}
                <div className="space-y-3 mb-8">
                    <div className="flex items-center justify-between px-1 mb-2">
                        <p className="text-sm font-bold text-foreground">
                            {feedback === 'bad' ? "👇 본인에게 맞는 유형을 선택해주세요" : "AI가 예측한 다른 순위"}
                        </p>
                        {feedback === 'bad' && <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin-slow" />}
                    </div>
                    
                    { candidates
                    .filter(c => c.cluster !== predictedClusterId)
                    .map((candidate) => {
                        const info = getClusterContent(candidate.cluster);
                        const isSelected = selectedCluster === candidate.cluster;
                        const isDescOpen = openDescId === candidate.cluster;

                        return (
                        <div 
                            key={candidate.cluster}
                            onClick={() => {
                                if (feedback === 'bad') {
                                    // useML의 setSelectedCluster를 통해 상태 업데이트
                                    setSelectedCluster(candidate.cluster);
                                }
                            }}
                            className={cn(
                                "relative flex flex-col p-4 rounded-2xl bg-card border transition-all duration-200",
                                (feedback === 'bad' && isSelected)
                                    ? "border-primary ring-1 ring-primary bg-blue-50/30 shadow-md scale-[1.01] z-10"
                                    : "border-border",
                                feedback === 'bad' && !isSelected && "cursor-pointer hover:border-primary/50 active:scale-[0.99]"
                            )}
                        >
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-colors", info.bgClass)}>
                                        {info.emoji}
                                    </div>
                                    <div className="text-left">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className={cn("font-bold text-sm", isSelected && feedback === 'bad' ? "text-primary" : "text-foreground")}>
                                                {info.title}
                                            </p>
                                            {isSelected && feedback === 'bad' && (
                                                <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full font-bold">
                                                    <Check className="w-2.5 h-2.5" /> 선택
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium">일치도 {Math.round(candidate.probability * 100)}%</p>
                                    </div>
                                </div>

                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDescId(isDescOpen ? null : candidate.cluster);
                                    }}
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                                        isDescOpen ? "bg-muted text-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    <HelpCircle className="w-4 h-4" />
                                </button>
                            </div>

                            <div className={cn(
                                "grid transition-all duration-300 ease-in-out text-left overflow-hidden",
                                isDescOpen ? "grid-rows-[1fr] opacity-100 mt-3 pt-3 border-t border-border" : "grid-rows-[0fr] opacity-0"
                            )}>
                                <div className="min-h-0 text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                                    {info.desc}
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>
            </div>

            {/* 하단 고정 버튼 */}
            <div className="fixed bottom-0 w-full max-w-[480px] bg-white/80 backdrop-blur-md border-t border-border p-5 z-20">
                <Button 
                    onClick={handleSubmit} 
                    disabled={!feedback || isSubmitting} 
                    className={cn(
                        "w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-all",
                        feedback 
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20 active:scale-[0.98]"
                            : "bg-muted text-muted-foreground shadow-none cursor-not-allowed"
                    )}
                >
                    {isSubmitting ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                        <>
                            {feedback === 'bad' ? "선택한 유형으로 결정하기" : "내 맞춤 카드 보러가기"}
                            {feedback && <ArrowRight className="w-5 h-5 ml-2 opacity-80" />}
                        </>
                    )}
                </Button>
            </div>

        </div>
    );
};

export default SurveyComplete;