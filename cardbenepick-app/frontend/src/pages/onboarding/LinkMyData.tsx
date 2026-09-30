import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react'; 
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils'; 

const mockCardCompanies = [
  { id: 'woori', name: '우리카드' },
  { id: 'samsung', name: '삼성카드' },
  { id: 'hyundai', name: '현대카드' },
  { id: 'hana', name: '하나카드' },
  { id: 'lotte', name: '롯데카드' },
  { id: 'ibk', name: 'IBK기업은행' },
  { id: 'sc', name: 'SC카드' },
  { id: 'sinhan', name: '신한카드' },
  { id: 'kb', name: 'KB국민카드' },
  { id: 'nh', name: 'NH농협카드' },
  { id: 'kakao', name: '카카오뱅크' },
  { id: 'bc', name: 'BC 바로카드' },
  { id: 'toss', name: '토스뱅크' },
  { id: 'kbank', name: '케이뱅크' },
  { id: 'shinhyup', name: '신협카드' },
  { id: 'newtown', name: '새마을금고' },
]

const CompanyLogo = ({ id, name }: { id: string, name: string }) => {
  const [imgError, setImgError] = useState(false);
  const isLargeLogo = ['samsung', 'kbank'].includes(id);

  if (imgError) {
    return <CreditCard className="w-6 h-6 mb-2 text-muted-foreground" />;
  }

  return (
    <img 
      src={`/logos/${id}.png`} 
      alt={name}
      className={cn(
        "mb-1 object-contain transition-all",
        isLargeLogo ? "w-11 h-11" : "w-8 h-8"
      )}
      onError={() => setImgError(true)} 
    />
  );
};

const LinkMyData = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  const handleCompanyClick = (companyId: string) => {
    setSelectedCompanies((prevSelected) =>
      prevSelected.includes(companyId)
        ? prevSelected.filter((id) => id !== companyId)
        : [...prevSelected, companyId]
    );
  };

  const handleLink = async () => {
    if (selectedCompanies.length === 0) {
      toast({
        title: "선택 필요",
        description: "연동할 카드사를 하나 이상 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem('token');
    
    if (!token) {
      toast({
        title: "인증 오류",
        description: "로그인 정보가 없습니다. 다시 로그인해주세요.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/assets/link', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ companies: selectedCompanies })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: '연동에 실패했습니다.' }));
        throw new Error(errorData.detail);
      }

      const result = await response.json();
      
      toast({
        title: "연동 성공",
        description: `총 ${result.count}건의 거래 내역을 불러왔습니다.`,
      });
      
      navigate('/app/wallet');

    } catch (error: any) {
      console.error("Link error:", error);
      toast({
        title: "연동 실패",
        description: error.message || "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // [수정] 전체 화면 높이(h-screen)를 사용하고 flex-col로 배치
    <div className="app-container flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center p-4 border-b bg-white sticky top-0 z-10 shrink-0">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/register')}
          className="mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">마이데이터 연동</h1>
      </div>

      {/* Content - Scrollable Area */}
      {/* [수정] flex-1과 overflow-y-auto를 줘서 이 부분만 스크롤되게 설정 */}
      <div className="flex-1 p-6 overflow-y-auto">
        <Card className="shadow-none border-none bg-white">
          <CardHeader className="text-center pb-6 pt-2">
            <CardTitle className="text-2xl font-bold mb-2">어떤 카드를 쓰시나요?</CardTitle> 
            <CardDescription className="text-base">
              자주 쓰는 카드사를 선택하면<br/>
              소비 패턴을 분석해 드려요.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8 p-0">
            <div className="grid grid-cols-3 gap-3">
              {mockCardCompanies.map((company) => {
                const isSelected = selectedCompanies.includes(company.id);
                return (
                  <div
                    key={company.id}
                    onClick={() => handleCompanyClick(company.id)}
                    className={cn(
                      "flex flex-col items-center justify-center h-20 rounded-2xl cursor-pointer transition-all duration-200 border",
                      isSelected 
                        ? "border-blue-500 bg-blue-50 shadow-sm" 
                        : "border-transparent bg-gray-50 hover:bg-gray-100"
                    )}
                  >
                    <CompanyLogo id={company.id} name={company.name} />
                    <span className={cn(
                      "text-xs font-medium mt-2",
                      isSelected ? "text-blue-600" : "text-gray-600"
                    )}>
                      {company.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Buttons - Fixed Bottom */}
      {/* [수정] 스크롤 영역 밖으로 꺼내서 하단에 고정 */}
      <div className="p-4 border-t bg-white safe-area-bottom shrink-0 space-y-3 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        <Button 
          className={cn(
            "w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-all",
            selectedCompanies.length > 0 
              ? "btn-gradient" 
              : "bg-gray-200 text-gray-400 hover:bg-gray-200 shadow-none"
          )}
          disabled={isLoading || selectedCompanies.length === 0}
          onClick={handleLink}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>데이터 불러오는 중...</span>
            </div>
          ) : (
            `${selectedCompanies.length}개 연동하기`
          )}
        </Button>

        <Button 
          variant="ghost" 
          className="w-full text-gray-400 hover:text-gray-600 h-10"
          onClick={() => navigate('/app/wallet')} 
        >
          나중에 하기
        </Button>
      </div>
    </div>
  );
};

export default LinkMyData;