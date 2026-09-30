import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CreditCard, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// 카드사 목록 (백엔드 DB에 있는 이름과 일치해야 함)
const cardCompanies = [
  { id: 'shinhan', name: '신한카드' },
  { id: 'samsung', name: '삼성카드' },
  { id: 'bc_baro', name: 'BC 바로카드' },
  { id: 'ibk', name: 'IBK기업은행' },
  { id: 'kb', name: 'KB국민카드' },
  { id: 'mg', name: 'MG새마을금고' },
  { id: 'nh', name: 'NH농협카드' },
  { id: 'lotte', name: '롯데카드' },
  { id: 'woori', name: '우리카드' },
  { id: 'hana', name: '하나카드' },
  { id: 'hyundai', name: '현대카드' },
];

interface CardProduct {
  card_id: string;
  card_name: string;
  card_company: string;
  card_image_url: string;
}

const RegisterCards = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // 단계 관리 (1: 카드사 선택, 2: 상품 및 정보 입력)
  const [step, setStep] = useState(1);
  
  // 입력 상태
  const [selectedCompany, setSelectedCompany] = useState('');
  const [products, setProducts] = useState<CardProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [pwd2, setPwd2] = useState('');

  // 카드사 선택 시 상품 목록 불러오기
  const handleCompanySelect = async (companyName: string) => {
    setSelectedCompany(companyName);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/assets/products?company=${companyName}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
        setStep(2); // 다음 단계로 이동
      } else {
        toast({ title: "오류", description: "카드 상품 정보를 불러오지 못했습니다.", variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "오류", description: "서버 통신 중 오류가 발생했습니다.", variant: "destructive" });
    }
  };

  const handleNext = () => {
    // 유효성 검사
    if (!selectedProductId || cardNumber.length < 16 || expiry.length < 4 || cvc.length < 3 || pwd2.length < 2) {
      toast({ title: "입력 확인", description: "모든 정보를 올바르게 입력해주세요.", variant: "destructive" });
      return;
    }

    // 선택한 상품 정보 찾기
    const selectedProduct = products.find(p => p.card_id === selectedProductId);

    // 다음 페이지(검증/등록)로 데이터 전달
    navigate('/app/wallet/verify', { 
      state: {
        cardData: {
          card_number: cardNumber,
          cvc: cvc,
          expiry_date: expiry,
          password_2digit: pwd2,
          card_product_id: selectedProductId,
          // UI 표시용 데이터
          product_name: selectedProduct?.card_name,
          company_name: selectedCompany,
          image_url: selectedProduct?.card_image_url
        }
      }
    });
  };

  // 카드 번호 포맷팅 (XXXX-XXXX...)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length > 16) val = val.slice(0, 16);
    setCardNumber(val);
  };

  return (
    <div className="app-container flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center p-4 border-b bg-white">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => step === 1 ? navigate('/app/wallet') : setStep(1)}
          className="mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">
          {step === 1 ? '카드사 선택' : '카드 정보 입력'}
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {step === 1 ? (
          // Step 1: 카드사 선택 그리드
          <div className="grid grid-cols-3 gap-4">
            {cardCompanies.map((company) => (
              <Button
                key={company.id}
                variant="outline"
                className="flex-col h-24 gap-2 hover:bg-accent/50 hover:border-primary"
                onClick={() => handleCompanySelect(company.name)}
              >
                <CreditCard className="w-8 h-8 text-primary/80" />
                <span className="text-xs font-medium">{company.name}</span>
              </Button>
            ))}
          </div>
        ) : (
          // Step 2: 상품 선택 및 정보 입력 폼
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>카드 상품 선택</Label>
              <Select onValueChange={setSelectedProductId} value={selectedProductId}>
                <SelectTrigger className="w-full h-12">
                  <SelectValue placeholder="카드를 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.card_id} value={p.card_id}>
                      {p.card_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProductId && (
               <div className="flex justify-center py-4">
                  {/* 선택한 카드 이미지 미리보기 */}
                  <img 
                    src={products.find(p => p.card_id === selectedProductId)?.card_image_url} 
                    alt="Card Preview" 
                    className="h-32 object-contain drop-shadow-md"
                    onError={(e) => e.currentTarget.src = "http://localhost:8080/placeholder.svg"}
                  />
               </div>
            )}

            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label>카드 번호</Label>
                  <Input 
                    type="tel" 
                    placeholder="1234123412341234" 
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    maxLength={16}
                    className="font-mono"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>유효기간 (MMYY)</Label>
                    <Input 
                      type="tel" 
                      placeholder="1225" 
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CVC (뒤 3자리)</Label>
                    <Input 
                      type="password" 
                      placeholder="***" 
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>카드 비밀번호 (앞 2자리)</Label>
                  <Input 
                    type="password" 
                    placeholder="**" 
                    className="w-1/2"
                    value={pwd2}
                    onChange={(e) => setPwd2(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                  />
                </div>
              </CardContent>
            </Card>

            <Button 
              className="w-full btn-gradient h-12 text-lg" 
              onClick={handleNext}
            >
              다음
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterCards;