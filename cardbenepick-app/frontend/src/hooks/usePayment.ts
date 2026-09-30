import { useMutation, useQueryClient } from '@tanstack/react-query';
// [변경] transactionApi 하나로 통합
import { transactionApi, PayRequest, EarnPointRequest } from '@/api/transaction';

interface PaymentProcessParams {
  paymentData: PayRequest;
  benefitData?: { 
    benefitId: number;
    discountAmount: number;
  };
}

export const usePaymentProcess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentData, benefitData }: PaymentProcessParams) => {
      // 1. 결제 승인 요청
      const payResult = await transactionApi.pay(paymentData);

      // 2. 혜택이 있다면 포인트 적립 요청 (순차 처리)
      let pointResult = null;
      if (benefitData && benefitData.benefitId) {
        try {
          const pointReq: EarnPointRequest = {
            benefit_id: benefitData.benefitId,
            amount: benefitData.discountAmount, 
            description: paymentData.merchant_name,
          };
          // [변경] transactionApi.earnPoint 사용
          pointResult = await transactionApi.earnPoint(pointReq);
        } catch (e) {
          console.warn("포인트 적립 실패 (결제는 성공함):", e);
        }
      }

      // 3. 최신 포인트 잔액 조회
      // [변경] transactionApi.getPointBalance 사용
      const balanceResult = await transactionApi.getPointBalance();

      return { payResult, pointResult, balanceResult };
    },
    onSuccess: () => {
      // 결제/포인트 관련 쿼리 무효화 (데이터 갱신)
      queryClient.invalidateQueries({ queryKey: ['myCards'] }); 
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['points'] });
    },
  });
};