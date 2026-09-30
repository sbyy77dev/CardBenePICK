import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionApi } from '@/api/transaction';
import { useToast } from '@/hooks/use-toast';

interface PayData {
    user_asset_id: number;
    amount: number;
    merchant_name: string;
    benefit_id?: number;
    discount_amount?: number;
}

/**
 * 💡 개요: 결제(pay), 포인트 적립(earn), 잔액 조회 로직을 캡슐화합니다.
 */
export const useTransactions = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // 1. [Mutation] 결제 및 포인트 처리 (Wallet.tsx의 핵심 로직)
    const payMutation = useMutation({
        // 결제 로직: pay -> earn -> balance 순으로 실행
        mutationFn: async (data: PayData) => {
            const { benefit_id, discount_amount, amount, merchant_name, user_asset_id } = data;

            // 1단계: 결제 승인 (pay)
            const payResult = await transactionApi.pay({
                user_asset_id,
                amount,
                merchant_name,
                benefit_id,
                discount_amount,
            });

            let pointBalance = 0;
            let earnCount = 0;
            
            // 2단계: 혜택이 있었다면 포인트 적립 (earn)
            if (benefit_id && discount_amount) {
                const earnResult = await transactionApi.earnPoint({
                    benefit_id,
                    amount: discount_amount,
                    description: merchant_name,
                });
                
                // 3단계: 적립 후 포인트 잔액 조회 (balance)
                const balanceResult = await transactionApi.getPointBalance();
                pointBalance = balanceResult.total_point;
                earnCount = balanceResult.earn_count;
            }

            return { payResult, pointBalance, earnCount };
        },

        onSuccess: (data) => {
            // 결제 성공 토스트 메시지
            toast({
                title: "결제 성공",
                description: `${data.payResult.merchant_name}에서 ${data.payResult.amount.toLocaleString()}원 결제되었습니다.`,
            });
            // 성공 시 필요한 캐시 무효화 (예: 자산 목록 갱신)
            queryClient.invalidateQueries({ queryKey: ['myCards'] }); 

            // Wallet.tsx에서 사용할 데이터 반환
            return data;
        },

        onError: (error: any) => {
            console.error("결제 처리 실패:", error);
            const detail = error.response?.data?.detail || "결제를 처리할 수 없습니다.";
            toast({ 
                title: "결제 실패", 
                description: detail, 
                variant: "destructive" 
            });
        },
    });

    // 2. [Query] 포인트 잔액 조회 (필요하다면 별도로 사용)
    const pointBalanceQuery = useMutation({
        mutationFn: transactionApi.getPointBalance
    });

    return {
        payMutation,
        fetchPointBalance: pointBalanceQuery.mutateAsync
    };
};