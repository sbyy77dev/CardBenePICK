import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDown, ChevronUp, Megaphone, CreditCard, Calendar 
} from 'lucide-react';
import { Notification, NotificationContent } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// DB에서 오는 데이터 구조 (제목, 내용 지원)
interface DBContent extends NotificationContent {
  title?: string;
  content?: string;
}

interface Props {
  item: Notification;
  // [수정 1] 상위 컴포넌트에서 클릭 이벤트를 받을 수 있게 추가
  onClick?: () => void; 
}

const NotificationItem = ({ item, onClick }: Props) => { // [수정 2] onClick props 받기
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const { alarm_type, content, created_at } = item;

  // ----------------------------------------------------------------
  // [Type 1] 카드 실적 알림 (파란색 카드) -> 아코디언 동작 유지
  // ----------------------------------------------------------------
  if (alarm_type === 1 && Array.isArray(content)) {
    const cardList = content as NotificationContent[];
    return (
      <div className="border-b border-border bg-white">
        <div 
          className="flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="mr-4">
            <div className="p-2 bg-blue-50 rounded-full text-blue-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-800">
              이번 달 카드 실적 현황 (9:00AM 기준)
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {isExpanded ? "아래에서 상세 내역을 확인하세요." : `${cardList.length}건의 카드 실적 보기`}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {isExpanded && (
          <div className="bg-slate-50 border-t border-slate-100">
            {cardList.map((card, idx) => {
              const current = Number(card.current_usage || 0);
              const target = Number(card.requirement || 1);
              const percent = Math.min((current / target) * 100, 100);
              
              return (
                <div 
                  key={idx} 
                  className="flex items-start p-4 border-b border-slate-100 last:border-0 hover:bg-slate-100 cursor-pointer transition-colors"
                  onClick={() => navigate(`/app/card/${encodeURIComponent(card.card_name)}`, { 
                      state: { isOwned: true } 
                  })}
                >
                  <div className="mr-4 flex-shrink-0">
                    {card.image_filename ? (
                      <img 
                        src={`/images/${card.image_filename}`} 
                        alt={card.card_name} 
                        className="w-12 h-auto object-contain drop-shadow-sm rounded-sm"
                      />
                    ) : (
                      <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-gray-700">{card.card_name}</span>
                      {percent >= 100 && <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-bold">달성완료</span>}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                      <div 
                        className={cn("h-2 rounded-full transition-all duration-500", percent >= 100 ? "bg-green-500" : "bg-blue-500")}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>{current.toLocaleString()}원</span>
                      <span>목표 {target.toLocaleString()}원</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------------------
  // [Type 3] 주간 지출 알림 (초록색 달력) -> [수정 3] onClick 연결
  // ----------------------------------------------------------------
  if (alarm_type === 3) {
    const notiContent = content as DBContent;
    return (
      <div 
        // 여기서 상위에서 전달받은 onClick 실행 (라우팅 트리거)
        onClick={onClick} 
        className="flex p-4 border-b border-border bg-white hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="mr-4 mt-1">
          <div className="p-2 bg-green-50 rounded-full text-green-600">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="flex-1">
          <div className="font-bold text-sm mb-1 text-gray-800">
             {notiContent.title || "주간 지출 리포트"} 
          </div>
          <div className="text-xs text-gray-500">
             {notiContent.content || notiContent.message || "지난주 소비 내역을 분석해드렸어요."}
          </div>
          <div className="text-[10px] text-gray-400 mt-2">
            {new Date(created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------
  // [Type 2] 공지사항 (빨간색 확성기) -> [수정 4] onClick 연결 (필요 시)
  // ----------------------------------------------------------------
  const notiContent = content as DBContent;

  return (
    <div 
      onClick={onClick} 
      className="flex p-4 border-b border-border bg-white hover:bg-gray-50 transition-colors cursor-pointer"
    >
      <div className="mr-4 mt-1">
        <div className="p-2 rounded-full bg-red-50 text-red-500">
          <Megaphone className="w-5 h-5" />
        </div>
      </div>

      <div className="flex-1">
        <div className="font-bold text-sm mb-1 text-gray-800">
          {notiContent.title || "공지사항"}
        </div>
        
        <div className="text-xs text-gray-500">
          {notiContent.message || notiContent.content || "새로운 소식이 있습니다."}
        </div>

        <div className="text-[10px] text-gray-400 mt-2">
          {new Date(created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;