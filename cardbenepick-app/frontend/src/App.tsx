import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PublicRoute, ProtectedRoute } from "@/components/auth/RouteGuards";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// 레이아웃
import MainLayout from "./components/MainLayout";

// --- 루트 페이지 ---
import Splash from "./pages/Splash";
import NotFound from "./pages/NotFound";

// --- 1. 인증 (auth) ---
import Login from "./pages/auth/Login";
import VerifyOtp from "./pages/auth/VerifyOtp";
import Register from "./pages/auth/Register";

// --- 2. 온보딩 (onboarding) ---
import LinkMyData from "./pages/onboarding/LinkMyData";
import Survey from "./pages/onboarding/Survey";
import SurveyComplete from "./pages/onboarding/SurveyComplete";

// --- 3. 메인 앱 (app) ---
import Chat from "./pages/app/chat/Chat";
import CardTransaction from './pages/app/wallet/CardTransaction';
import Wallet from "./pages/app/wallet/Wallet";
import RegisterCards from "./pages/app/wallet/RegisterCards";
import VerifyCard from "./pages/app/wallet/VerifyCard";
import Analysis from "./pages/app/all/Analysis";
import SpendingDetail from "./pages/app/all/SpendingDetail";
import SpendingCalendar from "./pages/app/calendar/SpendingCalendar";
import AnalysisLoading from "./pages/app/all/AnalysisLoading";
import CardPerformance from "./pages/app/all/CardPerformance";
import NoticeDetail from './pages/app/notification/NoticeDetail';
import MyPage from "./pages/app/user/MyPage";
import NotificationPage from "./pages/app/notification/NotificationPage";

// --- 4. 공용 페이지 (shared) ---
import Recommendations from "./pages/shared/Recommendations";
import CardDetail from "./pages/shared/CardDetail";

// --- 5. 기타 ---
import PaymentResultPage from './pages/PaymentResultPage';
import TestPage from './pages/TestPage';
import RecommendTypeSelect from "./pages/onboarding/RecommendTypeSelect";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="mobile-layout">
          <Routes>
            {/* [수정] 여기가 빠져 있었습니다! 앱의 대문(루트) 경로 추가 */}
            <Route path="/" element={<Splash />} />

            {/* ★ [핵심 변경] Survey 및 SurveyComplete는 인증과 무관하게 접근 가능하도록 최상위 레벨로 이동 */}
            <Route path="/survey" element={<Survey />} />
            <Route path="/survey-complete" element={<SurveyComplete />} />

            {/* --- 인증 및 온보딩 --- */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/verify-otp" element={<VerifyOtp />} />
              <Route path="/register" element={<Register />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/link-mydata" element={<LinkMyData />} />
              {/* RecommendTypeSelect는 로그인한 사용자만 접근 가능 (분기 페이지) */}
              <Route path="survey/recommend-type-select" element={<RecommendTypeSelect />} />

              <Route path="/analysis-loading" element={<AnalysisLoading />} />
              <Route path="/recommendations" element={<Recommendations />} />

              {/* [중요] 카드 상세 페이지는 탭바에 가려지지 않게 Layout 밖으로 뺌 */}
              <Route path="/app/card/:cardId" element={<CardDetail />} />

              {/* --- 메인 앱 플로우 --- */}
              <Route path="/app" element={<MainLayout />}>
                {/* ★ [핵심] 시작 화면을 'wallet' -> 'chat'으로 변경! */}
                <Route index element={<Navigate to="chat" replace />} />
                
                <Route path="chat" element={<Chat />} />
                
                <Route path="wallet/history/:cardId" element={<CardTransaction />} />
                <Route path="wallet" element={<Wallet />} />
                <Route path="wallet/add" element={<RegisterCards />} />
                <Route path="wallet/verify" element={<VerifyCard />} />

                <Route path="analysis" element={<Analysis />} />
                <Route path="mypage" element={<MyPage />} />

                <Route path="analysis/detail" element={<SpendingDetail />} />
                <Route path="analysis/calendar" element={<SpendingCalendar />} />
                <Route path="performance" element={<CardPerformance />} />
                <Route path="notifications" element={<NotificationPage />} />
                <Route path="notification/:id" element={<NoticeDetail />} />
              </Route>

              {/* 기타 */}
              <Route path="/payment/result" element={<PaymentResultPage />} />
            </Route>
            <Route path="/test" element={<TestPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;