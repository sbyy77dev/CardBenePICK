import { useState } from 'react';
import RewardCelebration from '../components/RewardCelebration';

export default function TestPage() {
  const [showReward, setShowReward] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <button
        onClick={() => setShowReward(true)}
        className="bg-orange-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-orange-600"
      >
        연출 테스트
      </button>

      {showReward && (
        <RewardCelebration
          savingsAmount={38000}     // 필수
          rewardRate={2.5}          // 필수
          total_point={150000}
          usageCount={12}
          onClose={() => setShowReward(false)}  // 선택
        />
      )}
    </div>
  );
}
