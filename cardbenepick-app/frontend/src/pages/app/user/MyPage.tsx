import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, LogOut, Trash2, User, CreditCard, ChevronRight, Building2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

// [변경] Store 및 Hook 임포트
import { useUserStore } from '@/store/useUserStore';
import { useCardStore, Asset } from '@/store/useCardStore';
import { useUser } from '@/hooks/useUser'; // [변경] useWithdrawMutation -> useUser

const MyPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // 1. 전역 상태(Store) 및 훅 사용
  // useUser 훅에서 user 정보와 withdraw 함수를 한 번에 가져옵니다.
  const { user, withdraw } = useUser(); 
  const { logout: logoutUser } = useUserStore(); // 로그아웃은 Store 액션 직접 사용
  
  // useCardStore는 Zustand로 관리되므로 그대로 사용
  const { assets, fetchAssets, removeAsset, clearAssets } = useCardStore();

  // 3. 컴포넌트 마운트 시 최신 자산 목록 불러오기
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // 4. 연동된 기관(카드사) 목록 추출 (중복 제거)
  const linkedInstitutions = Array.from(new Set(assets.map(a => a.institution_name)));

  // --- 핸들러 함수들 ---

  // 휴대폰 번호 포맷팅 함수
  const formatPhoneNumber = (phoneNumber?: string) => {
    if (!phoneNumber) return '';
    return phoneNumber
      .replace(/[^0-9]/g, '')
      .replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, '$1-$2-$3');
  };

  const handleLogout = () => {
    logoutUser();
    clearAssets();
    toast({ title: "로그아웃", description: "성공적으로 로그아웃되었습니다." });
    navigate('/login');
  };

  const handleWithdraw = () => {
    // 훅을 통해 탈퇴 요청 실행 (API 호출 -> 성공 시 로그아웃 및 이동)
    withdraw();
  };

  const handleDeleteAsset = async (assetId: number, assetName: string) => {
    try {
      await removeAsset(assetId);
      toast({ title: "삭제 완료", description: `${assetName} 카드가 삭제되었습니다.` });
    } catch (error) {
      toast({ title: "삭제 실패", description: "카드를 삭제하지 못했습니다.", variant: "destructive" });
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/app/analysis')}
          className="mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">마이페이지</h1>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        
        {/* 1. 내 정보 카드 */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <User className="w-6 h-6 text-primary" />
              <CardTitle>내 정보</CardTitle>
            </div>
            <CardDescription>
              가입된 회원 정보입니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="이름" value={user?.user_name} />
            <InfoRow 
              label="휴대폰 번호" 
              value={formatPhoneNumber(user?.phone_number)} 
            />
            <InfoRow label="생년월일" value={user?.birth_date} />
            <InfoRow label="통신사" value={user?.telecom} />
          </CardContent>
        </Card>
        
        {/* 2. 연동된 카드사 (요약) */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Building2 className="w-6 h-6 text-primary" />
              <CardTitle>연동된 금융사</CardTitle>
            </div>
             <CardDescription>
              마이데이터로 연결된 카드사 목록입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {linkedInstitutions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {linkedInstitutions.map((name) => (
                  <div key={name} className="px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full font-medium">
                    {name}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">연동된 금융사가 없습니다.</p>
            )}
            <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/link-mydata')}>
              카드사 추가 연동하기
            </Button>
          </CardContent>
        </Card>
        
        {/* 3. 보유 카드 목록 (개별 관리) */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <CreditCard className="w-6 h-6 text-primary" />
              <CardTitle>내 카드 관리</CardTitle>
            </div>
            <CardDescription>
              등록된 모든 카드({assets.length}장)를 관리합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {assets.length > 0 ? assets.map(asset => (
              <AssetRow 
                key={asset.asset_id} 
                asset={asset} 
                onDelete={() => handleDeleteAsset(asset.asset_id, asset.external_account_name || '카드')} 
              />
            )) : (
              <p className="text-sm text-muted-foreground text-center py-4">등록된 카드가 없습니다.</p>
            )}
            
            <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/app/wallet/add')}>
              카드 직접 등록하기
            </Button>
          </CardContent>
        </Card>

        {/* 4. 계정 관리 (로그아웃/탈퇴) */}
        <Card className="shadow-card border-destructive/20">
          <CardHeader>
            <CardTitle>계정 관리</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-between h-12"
              onClick={handleLogout}
            >
              <span><LogOut className="w-5 h-5 mr-3 inline" />로그아웃</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between h-12 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  <span><Trash2 className="w-5 h-5 mr-3 inline" />회원 탈퇴</span>
                  <ChevronRight className="w-5 h-5 text-destructive/50" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>정말 탈퇴하시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    회원 탈퇴 시 <strong>모든 자산 정보와 소비 분석 내역이 즉시 삭제</strong>되며, 복구할 수 없습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={handleWithdraw} className="bg-destructive hover:bg-destructive/90">
                    탈퇴하기
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// --- 하위 컴포넌트 ---

const InfoRow = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex justify-between items-center text-sm border-b border-muted/50 last:border-0 pb-2 last:pb-0">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value || '-'}</span>
  </div>
);

const AssetRow = ({ asset, onDelete }: { asset: Asset; onDelete: () => void }) => (
  <div className="flex items-center justify-between p-3 bg-muted/30 border rounded-lg hover:bg-muted/50 transition-colors">
    <div className="flex-1 overflow-hidden mr-3">
      <p className="font-medium text-sm truncate">{asset.external_account_name}</p>
      <p className="text-xs text-muted-foreground">{asset.institution_name}</p>
    </div>
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0">
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>카드를 삭제하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">[{asset.institution_name}] {asset.external_account_name}</span>
            <br />
            해당 카드의 모든 거래 내역도 함께 삭제됩니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
);

export default MyPage;