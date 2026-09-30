import { useNavigate } from "react-router-dom";
import { ArrowLeft, Database, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const RecommendTypeSelect = () => {
    const navigate = useNavigate();

    // 뒤로 가기 (Analysis 페이지로 돌아감. 라우팅 구조상 -1)
    const handleBack = () => {
        navigate(-1);
    };

    // 마이데이터 연동 선택: SurveyComplete로 이동하며 'mydata' 플래그를 state로 전달
    const handleSelectMyData = () => {
        // SurveyComplete로 바로 이동하며, 해당 페이지에서 MyData 예측 훅(useMyDataML)이 실행됨
        navigate('/survey-complete', { state: { predictionType: 'mydata' } });
    };

    // 설문조사 선택: 기존 설문 페이지로 이동
    const handleSelectSurvey = () => {
        // 설문조사 페이지로 이동하여 Cold Start 로직 (useML)을 따릅니다.
        navigate('/survey');
    };

    return (
        <div className="app-container">
            <div className="flex items-center p-4 border-b">
                <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/app/analysis')}
                className="mr-3"
                >
                <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-lg font-semibold">카드 추천 방식 선택</h1>
            </div>


            {/* [수정된 부분: 내용이 중앙 정렬 및 최대 폭 제한] */}
            <main className="flex-grow flex flex-col items-center overflow-y-auto w-full">
                <div className="w-full max-w-md px-6 pt-8 pb-12 space-y-8">
                    <div className="text-center space-y-2">
                        <h1 className="text-2xl font-bold text-primary">맞춤형 카드 추천</h1>
                        <p className="text-muted-foreground">
                            고객님을 위한 최적의 추천 방식을 선택해 주세요.
                        </p>
                    </div>

                    {/* 1. 마이데이터 연동 카드 (즉시 추천) */}
                    <Card 
                        className="w-full cursor-pointer hover:shadow-lg transition-shadow border-2 border-primary/50"
                        onClick={handleSelectMyData}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xl font-semibold">
                                마이데이터 기반 추천
                            </CardTitle>
                            <Database className="h-8 w-8 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-base text-foreground">
                                실제 소비 데이터를 분석하여<br />
                                가장 정확하고 개인화된 카드를 즉시 추천합니다.
                            </CardDescription>
                            <Button 
                                className="mt-4 w-full h-12 text-lg font-bold"
                                onClick={handleSelectMyData}
                            >
                                마이데이터로 즉시 추천받기
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="relative flex justify-center w-full">
                        <Separator className="absolute top-1/2 w-full" />
                        <span className="bg-background px-4 text-sm font-medium text-muted-foreground z-10">
                            또는
                        </span>
                    </div>

                    {/* 2. 설문조사 기반 카드 (Cold Start) */}
                    <Card 
                        className="w-full cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={handleSelectSurvey}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xl font-semibold">
                                간편 설문조사 추천
                            </CardTitle>
                            <Send className="h-8 w-8 text-secondary" />
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-base text-foreground">
                                간단한 라이프스타일 설문을 통해<br />
                                빠르게 AI 기반 추천을 받습니다.
                            </CardDescription>
                            <Button 
                                variant="outline"
                                className="mt-4 w-full h-12 text-lg font-bold border-secondary text-secondary hover:bg-secondary/10"
                                onClick={handleSelectSurvey}
                            >
                                설문조사로 추천받기
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default RecommendTypeSelect;