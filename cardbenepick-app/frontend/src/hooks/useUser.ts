import { 
    useQuery, 
    useMutation, 
    useQueryClient,
    UseQueryResult,
    QueryFunction, // QueryFn 타입 정의를 위해 추가
    UseQueryOptions, // 옵션 타입 명시를 위해 추가
} from '@tanstack/react-query';
import { userApi } from '@/api/user';
import { useUserStore, User } from '@/store/useUserStore';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';


// 💡 1. userApi.getMe의 반환 타입을 QueryFunction으로 명확하게 정의합니다.
// getMe는 Promise<User>를 반환합니다.
type UserQueryFn = QueryFunction<User, string[], unknown>; 

// 💡 2. useQuery 옵션 타입을 정의합니다. (Data: User, Error: AxiosError)
type UserQueryOptions = UseQueryOptions<User, AxiosError, User, string[]>;


/**
 * 💡 개요: 현재 로그인된 유저 정보를 가져오고(Query) 탈퇴를 처리(Mutation)합니다.
 * 데이터는 useUserStore(Zustand)와 동기화됩니다.
 */
export const useUser = () => {
    const queryClient = useQueryClient();
    const { logout, setUser, user: storedUser, isLoggedIn } = useUserStore();
    const navigate = useNavigate();

    // 1. [Query] 유저 정보 가져오기 (메인 로직)
    // 💡 useQuery에 타입을 명시하여 onSuccess/onError 콜백을 허용하도록 합니다.
    const userQuery: UseQueryResult<User, AxiosError> = useQuery({
        queryKey: ['currentUser'],
        queryFn: userApi.getMe as UserQueryFn, // 정의한 QueryFn 타입 캐스팅

        // [핵심] useQuery 옵션 객체 (UserQueryOptions 타입 사용)
        enabled: isLoggedIn, 
        staleTime: 5 * 60 * 1000, 
        retry: 1, 

        // 성공 시 Zustand Store와 동기화
        onSuccess: (data) => { // data는 User 타입으로 자동 추론됩니다.
            setUser(data); 
        },
        // 실패 시 처리 (error 타입을 AxiosError로 명시)
        onError: (error: AxiosError) => {
            console.error("유저 정보 로드 실패:", error);
            // 401 에러는 client.ts의 인터셉터에서 처리되므로, 
            // 여기서는 네트워크 오류 등 다른 실패만 처리
            if (error.response?.status !== 401) {
                 // 추가적인 에러 처리 (필요시)
            }
        },
    } as UserQueryOptions); // 최종적으로 옵션을 UseQueryOptions 타입으로 캐스팅

    // 2. [Mutation] 회원 탈퇴
    const withdrawMutation = useMutation({
        mutationFn: userApi.withdraw,
        onSuccess: () => {
            logout(); // Zustand 로그아웃 (카드 정보 정리 포함)
            queryClient.clear(); // React Query 캐시 전체 삭제
            navigate('/', { replace: true });
        },
        onError: (error) => {
            console.error("회원 탈퇴 실패:", error);
        }
    });

    // 3. Store의 유저 정보가 최신 데이터 (SSOT: Single Source of Truth)
    return {
        user: storedUser,
        isLoading: userQuery.isLoading,
        isError: userQuery.isError,
        refetch: userQuery.refetch,
        
        withdraw: withdrawMutation.mutateAsync,
    };
};