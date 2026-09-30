import { useEffect, useState } from 'react';

interface RewardCelebrationProps {
  savingsAmount: number;
  rewardRate: number;
  total_point: number;
  usageCount: number;
  onClose?: () => void;
}

export default function RewardCelebration({ 
  savingsAmount, 
  rewardRate,
  total_point,
  usageCount,
  onClose 
}: RewardCelebrationProps) {
  const [displayAmount, setDisplayAmount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  
  const rewardAmount = Math.floor(savingsAmount * rewardRate / 100);

  // 사용 횟수에 따른 등급 자동 계산
  const getUserTier = (count: number) => {
    if (count >= 100) return { name: 'VIP', emoji: '👑', color: 'text-purple-600' };
    if (count >= 50) return { name: 'GOLD', emoji: '🥇', color: 'text-yellow-600' };
    if (count >= 5) return { name: 'SILVER', emoji: '🥈', color: 'text-gray-500' };
    if (count >= 1) return { name: 'BRONZE', emoji: '🥉', color: 'text-orange-600' };
    return { name: 'NEW', emoji: '⭐', color: 'text-blue-600' };
  };

  const tier = getUserTier(usageCount);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 700);
  };

  useEffect(() => {
    // 숫자 카운트업
    const animationDuration = 1500;
    const startTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / animationDuration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      
      setDisplayAmount(Math.floor(rewardAmount * easeProgress));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, [rewardAmount]);

  if (!isVisible) return null;

  return (
  <div 
    className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-700 ${
      isExiting ? 'opacity-0' : 'opacity-100'
    }`}
    onClick={handleClose}
  >
    <div className={`w-[85%] max-w-xs transition-all duration-300 ${
      isExiting ? 'scale-90 opacity-0' : 'animate-bounce-in'
    }`}>
      {/* 메인 카드 */}
      <div className="relative bg-white rounded-2xl p-6 shadow-2xl overflow-hidden">
        {/* 상단 배경 장식 */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-blue-50 to-transparent" />
        
        {/* 컨텐츠 */}
        <div className="relative z-10 text-center">
          {/* 상단 텍스트 */}
          <div className="mb-3">
            <p className="text-gray-500 text-xs font-medium">
              {savingsAmount.toLocaleString()}원 할인 예정
            </p>
          </div>

          {/* 큰 적립 금액 */}
          <div className="mb-5">
            {/* <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-4xl">🎉</span>
            </div> */}
            
            <div className="text-gray-900 text-xl font-bold mb-2">
              <span className="text-blue-600 text-5xl font-black tracking-tight mb-1">
                +{displayAmount.toLocaleString()} 
              </span>  원
            </div>
            <div className="inline-block bg-blue-600 px-5 py-1.5 rounded-full">
              <p className="text-white text-xs font-semibold">
                추가 적립 완료!
              </p>
            </div>
          </div>

          {/* 구분선 */}
          <div className="h-px bg-gray-200 mb-3" />

          {/* 하단 정보 */}
          <div className="space-y-2">
            <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
              <p className="text-gray-700 text-xs">
                🎯 <span className="font-bold text-gray-900">{usageCount}번</span> 이용하셨어요
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-white rounded-xl p-2.5 border border-blue-100">
              <p className="text-gray-700 text-xs flex items-center justify-center gap-1">
                <span>{tier.emoji}</span>
                <span className={`font-bold text-sm ${tier.color}`}>
                  {tier.name}
                </span>
                <span>등급이에요!</span>
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
              <p className="text-gray-700 text-xs">
                💎 총 적립 : <span className="font-bold text-blue-600 text-sm">{total_point.toLocaleString()}</span>원
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 힌트 */}
      <p className="text-center text-white/70 text-xs mt-3">
        탭하여 닫기
      </p>
    </div>
  </div>
);
}
