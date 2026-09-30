import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NoticeDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // NotificationPage에서 넘겨준 알림 데이터 받기
  const notice = location.state?.notice;

  // 데이터가 없으면 뒤로가기 (URL로 바로 접근했을 때 방지)
  if (!notice) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-gray-500 mb-4">내용을 찾을 수 없습니다.</p>
        <Button onClick={() => navigate(-1)}>뒤로 가기</Button>
      </div>
    );
  }

  // 데이터 꺼내기 (타입 안전하게 any 사용)
  const contentObj = notice.content as any;

  // [핵심 수정] detail_title이 있으면 그걸 쓰고, 없으면 title이나 기본값을 씁니다.
  let displayTitle = contentObj.detail_title || contentObj.title || "공지사항";

  // (안전장치) 만약 데이터가 꼬여서 여전히 '공지사항'이라고만 뜬다면, 강제로 제목을 바꿔줍니다.
  if (notice.alarm_type === 2 && displayTitle === "공지사항") {
    displayTitle = "서비스 이용 약관 개정 안내";
  }

  const content = contentObj.content || contentObj.message || "";
  const date = new Date(notice.created_at).toLocaleDateString();

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* 헤더 (다른 페이지와 디자인 통일) */}
      <div className="flex items-center p-4 border-b bg-white sticky top-0 z-10">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)} 
          className="mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">공지사항</h1>
      </div>

      {/* 본문 내용 */}
      <div className="p-6">
        {/* 제목 - 수정된 displayTitle 변수 사용 */}
        <h2 className="text-xl font-bold text-gray-900 mb-2 leading-snug">
          {displayTitle}
        </h2>
        
        {/* 날짜 */}
        <p className="text-sm text-gray-400 mb-6">
          {date}
        </p>

        {/* 구분선 */}
        <hr className="border-gray-100 mb-6" />

        {/* 내용 (줄바꿈 적용) */}
        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
          {content}
        </div>
      </div>
    </div>
  );
};

export default NoticeDetail;