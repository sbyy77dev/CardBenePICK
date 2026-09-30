import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import RewardCelebration from '../components/RewardCelebration';

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showReward, setShowReward] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    // 결제 결과 API 호출
    const fetchPaymentResult = async () => {
      const paymentId = searchParams.get('payment_id');
      
      try {
        const response = await fetch(`/api/payment/${paymentId}`);
        const data = await response.json();
        
        setPaymentData(data);
        setShowReward(true);  // 연출 시작
      } catch (error) {
        console.error('결제 결과 조회 실패:', error);
      }
    };

    fetchPaymentResult();
  }, [searchParams]);

  const handleRewardClose = () => {
    setShowReward(false);
    // 연출 후 액션 (예: 홈으로 이동)
    // navigate('/home');
  };

  if (!paymentData) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {showReward && (
        <RewardCelebration
          savingsAmount={paymentData.discount_amount}
          rewardRate={2.5}
          onClose={handleRewardClose}
        />
      )}

      <div className="max-w-md mx-auto mt-8 bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          결제 완료
        </h2>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">결제 금액</span>
            <span className="font-semibold">
              {paymentData.payment_amount.toLocaleString()}원
            </span>
          </div>
          
          <div className="flex justify-between text-green-600">
            <span>할인 금액</span>
            <span className="font-semibold">
              -{paymentData.discount_amount.toLocaleString()}원
            </span>
          </div>
          
          <div className="flex justify-between text-orange-600">
            <span>적립 금액</span>
            <span className="font-semibold">
              +{Math.floor(paymentData.discount_amount * 2.5 / 100).toLocaleString()}원
            </span>
          </div>
          
          <div className="border-t pt-3 flex justify-between text-lg font-bold">
            <span>최종 결제</span>
            <span>{paymentData.final_amount.toLocaleString()}원</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/home')}
          className="w-full mt-6 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition"
        >
          확인
        </button>
      </div>
    </div>
  );
}
