import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Loader2, CheckCircle, Beaker, Bell } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input'; 
import { Label } from '@/components/ui/label'; 
import { cn } from '@/lib/utils';
import { useCardStore } from '@/store/useCardStore';
import { useToast } from '@/hooks/use-toast';
import RewardCelebration from '@/components/RewardCelebration';

// [Hook 임포트] 결제 처리 로직
import { usePaymentProcess } from '@/hooks/usePayment';

// [핵심] 환경변수에서 이미지 기본 경로 가져오기 (없으면 '/images' 사용)
const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || '/images';

// [핵심] 이미지 경로 완성 함수
const getImageUrl = (filename?: string) => {
  if (!filename) return '/placeholder.svg'; 
  if (filename.startsWith('http') || filename.startsWith('data:')) return filename; 
  
  const base = IMAGE_BASE_URL.endsWith('/') ? IMAGE_BASE_URL.slice(0, -1) : IMAGE_BASE_URL;
  const file = filename.startsWith('/') ? filename.slice(1) : filename;
  
  return `${base}/${file}`;
};

// [컴포넌트] 로그 추가된 AutoOrientedCardImage
const AutoOrientedCardImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
  const [isPortrait, setIsLandscape] = useState(false);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalHeight > naturalWidth) {
      setIsLandscape(true);
    }
  };

  return (
    <img
      src={src}
      alt={alt}
      onLoad={handleImageLoad}
      className={cn(
        className,
        "transition-transform duration-300",
        isPortrait 
          ? "-rotate-90 scale-[1.6] object-contain" 
          : "object-cover"
      )}
      onError={(e) => { 
        // console.error(`[Image Error] Failed to load: ${src}`);
        e.currentTarget.src = '/placeholder.svg'; 
      }}
    />
  );
};

const VerticalCardImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
  const [isLandscape, setIsLandscape] = useState(false);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth > naturalHeight) {
      setIsLandscape(true);
    }
  };

  return (
    <img
      src={src}
      alt={alt}
      onLoad={handleImageLoad}
      className={cn(
        className,
        "transition-transform duration-300",
        isLandscape
          ? "-rotate-90 scale-[1.6] object-contain" 
          : "object-cover"
      )}
      onError={(e) => { 
        e.currentTarget.src = '/placeholder.svg'; 
      }}
    />
  );
};


const Wallet = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const { assets, fetchAssets, isLoading } = useCardStore();
  const { mutateAsync: processPayment } = usePaymentProcess();

  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'activating' | 'activated'>('idle');

  // RewardCelebration 상태
  const [showReward, setShowReward] = useState(false);
  const [rewardData, setRewardData] = useState({
    savingsAmount: 0,
    totalPoint: 0,
    usageCount: 0
  });

  const incomingPayment = location.state?.payment; 
  const benefitId = incomingPayment?.benefit_id;
  const discountAmount = incomingPayment?.discount_amount;
  
  const isAutoPay = !!(benefitId && discountAmount);

  const [merchant, setMerchant] = useState<string>(incomingPayment?.merchant || '');
  const [amount, setAmount] = useState<string>(incomingPayment?.amount ? String(incomingPayment.amount) : '');

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // [데이터 매핑] 여기가 핵심입니다!
  const carouselItems = [
    ...assets.map(asset => {
      // 1. 백엔드에서 이미지 파일명을 줬으면 그걸 씀
      // 2. 안 줬으면(null이면) ID + 'card.png'로 추측해서 만듦
      // (jpg, gif 등 확장자가 다양하면 백엔드에서 파일명을 주는 게 제일 좋지만, 일단 png로 시도)
      const filename = asset.card_image_url 
        ? asset.card_image_url 
        : `${asset.external_account_id}card.png`;

      const finalUrl = getImageUrl(filename);
      
      // console.log(`[Image Check] ID:${asset.external_account_id} -> ${finalUrl}`);
      
      return {
        id: asset.asset_id.toString(),
        name: asset.external_account_name || asset.institution_name,
        cardImage: finalUrl,
        type: 'card',
        originalAsset: asset
      };
    }),
    { id: 'add', name: '카드 추가', cardImage: '', type: 'add', originalAsset: null }
  ];

  const handleSimulateChatbot = () => {
    if (assets.length === 0) return;
    const targetCardId = assets[0].asset_id.toString(); 
    navigate('/app/wallet', { 
        state: { 
            recommendedCardId: targetCardId,
            payment: { merchant: '테스트 가맹점', amount: 8500 } 
        } 
    });
  };

  useEffect(() => {
    if (!api) return;
    const recommendedCardId = location.state?.recommendedCardId;
    
    if (recommendedCardId) {
      const targetIndex = carouselItems.findIndex(item => 
        item.id === String(recommendedCardId) || 
        (item.originalAsset && item.originalAsset.external_account_id === String(recommendedCardId))
      );

      if (targetIndex !== -1) {
        api.scrollTo(targetIndex); 
        setActiveIndex(targetIndex);
      }
      if (location.state?.payment) {
          setMerchant(location.state.payment.merchant);
          setAmount(String(location.state.payment.amount));
          setIsModalOpen(true); 
      }
    } else {
      setActiveIndex(api.selectedScrollSnap());
    }

    const onSelect = () => {
      setActiveIndex(api.selectedScrollSnap());
    };
    api.on("select", onSelect);
    return () => { api.off("select", onSelect); };
  }, [api, location.state, navigate, assets]);

  const handlePayment = async () => {   
    const currentItem = carouselItems[activeIndex];
    if (!currentItem?.originalAsset) return;

    const hasIncomingBenefit = incomingPayment?.benefit_id && incomingPayment?.discount_amount;

    if (!hasIncomingBenefit) {
        if (!amount || !merchant) {
            toast({ title: "입력 확인", description: "가맹점과 금액을 입력해주세요.", variant: "destructive" });
            return;
        }
    }

    setPaymentStatus('activating'); 

    try {
        const result = await processPayment({
            paymentData: {
                user_asset_id: currentItem.originalAsset.asset_id,
                amount: parseInt(amount),
                merchant_name: merchant,
                benefit_id: benefitId,
                discount_amount: discountAmount
            },
            benefitData: hasIncomingBenefit ? {
                benefitId: benefitId,
                discountAmount: discountAmount
            } : undefined
        });

        setTimeout(() => {
            setPaymentStatus('activated');
            toast({
                title: "결제 성공",
                description: `${result.payResult.merchant}에서 ${result.payResult.amount.toLocaleString()}원 결제되었습니다.`
            });

            setTimeout(() => {
                setPaymentStatus('idle');
                setIsModalOpen(false);
                
                setRewardData({
                    savingsAmount: discountAmount || parseInt(amount) * 0.1, 
                    totalPoint: result.balanceResult?.total_point || 0,
                    usageCount: result.balanceResult?.earn_count || 0
                });
                
                setShowReward(true);
                
                setMerchant('');
                setAmount('');
                if (location.state?.payment) {
                    navigate(location.pathname, { replace: true, state: {} });
                }
            }, 1500);

        }, 1000);

    } catch (error) {
        console.error(error);
        toast({ title: "결제 실패", description: "결제를 처리할 수 없습니다.", variant: "destructive" });
        setPaymentStatus('idle'); 
        setIsModalOpen(false);
    }
  };

  useEffect(() => {
    if (isModalOpen && paymentStatus === 'idle' && isAutoPay && amount && merchant) {
        handlePayment(); 
    }
  }, [isModalOpen, paymentStatus, isAutoPay, amount, merchant]); 

  const onModalOpenChange = (open: boolean) => {
    if (!open) {
      setPaymentStatus('idle');
      setMerchant('');
      setAmount('');
      if (location.state?.payment) {
          navigate(location.pathname, { replace: true, state: {} });
      }
    }
    setIsModalOpen(open);
  }

  const getActiveItem = () => carouselItems[activeIndex] || carouselItems[0];
  const isAddCardActive = getActiveItem().id === 'add';

  const handleCardImageClick = (item: typeof carouselItems[0]) => {
    if (item.type === 'card' && item.originalAsset) {
        console.log("이동할 자산 정보:", item.originalAsset); 

        navigate(`/app/wallet/history/${item.originalAsset.external_account_id}`, { 
            state: { 
              cardInfo: item.originalAsset 
            } 
        });
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* RewardCelebration */}
      {showReward && (
        <RewardCelebration
          savingsAmount={rewardData.savingsAmount}
          rewardRate={2.5}
          total_point={rewardData.totalPoint}
          usageCount={rewardData.usageCount}
          onClose={() => setShowReward(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center p-4 border-b bg-white justify-between relative">
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground absolute left-4" onClick={handleSimulateChatbot}>
            <Beaker className="w-4 h-4 mr-1" /> Test
        </Button>
        <h1 className="text-lg font-semibold flex-1 text-center">내 지갑</h1>
        <Button variant="ghost" size="icon" className="absolute right-4" onClick={() => navigate('/app/notifications')}>
          <Bell className="w-6 h-6 text-gray-700" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-6 space-y-8 overflow-hidden">
        {isLoading ? (
            <div className="flex flex-col items-center animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">카드를 불러오는 중...</p>
            </div>
        ) : (
        <Carousel setApi={setApi} className="w-full max-w-xs perspective-1000" opts={{ loop: false, align: "center" }}>
          <CarouselContent>
            {carouselItems.map((card) => (
              <CarouselItem key={card.id} >
                {card.id === 'add' ? (
                  <div onClick={() => navigate('/app/wallet/add')} className="cursor-pointer">
                    <Card className="shadow-sm border-2 border-dashed border-slate-300 bg-white/50 flex items-center justify-center hover:bg-slate-100 transition-colors" style={{ aspectRatio: '85.6 / 53.98' }}>
                      <div className="flex flex-col items-center text-slate-400">
                        <Plus className="w-10 h-10 mb-2" />
                        <span className="text-sm font-medium">카드 추가</span>
                      </div>
                    </Card>
                  </div>
                ) : (
                  <div className="p-1 cursor-pointer active:scale-95 transition-transform" onClick={() => handleCardImageClick(card)}>
                    <Card className="shadow-elevated overflow-hidden rounded-lg bg-white flex items-center justify-center pointer-events-none" style={{ aspectRatio: '85.6 / 53.98' }}>
                        <AutoOrientedCardImage src={card.cardImage} alt={card.name} className="w-full h-full" />
                    </Card>
                  </div>
                )}
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="text-center mt-6 space-y-1 h-12">
            {!isAddCardActive && (
                <>
                    <h3 className="text-lg font-bold text-slate-800">{getActiveItem().name}</h3>
                    <p className="text-xs text-slate-500">{getActiveItem().originalAsset?.institution_name}</p>
                </>
            )}
          </div>
        </Carousel>
        )}

        <div className="flex justify-center gap-2">
          {carouselItems.map((_, index) => (
            <div key={index} className={cn("w-2 h-2 rounded-full transition-all duration-300", index === activeIndex ? "w-4 bg-primary" : "bg-slate-300")} />
          ))}
        </div>

        <div className="w-full max-w-xs">
            {!isAddCardActive ? (
            <AlertDialog open={isModalOpen} onOpenChange={onModalOpenChange}>
                <AlertDialogTrigger asChild>
                <Button className="w-full btn-gradient h-12 text-lg font-bold shadow-lg transition-transform active:scale-95">
                    결제하기
                </Button>
                </AlertDialogTrigger>
                
                <AlertDialogContent className="max-w-[320px] rounded-2xl">
                
                {paymentStatus === 'idle' && !isAutoPay && (
                    <>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-center">
                            {incomingPayment ? "결제 확인" : "결제 정보 입력"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center">
                           {incomingPayment ? "아래 내용으로 결제하시겠습니까?" : "결제할 가맹점과 금액을 입력해주세요."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    <div className="py-6">
                        {incomingPayment ? (
                            <div className="text-center space-y-2">
                                <p className="text-xl font-bold text-slate-900">{merchant}</p>
                                <div className="text-3xl font-black text-primary tracking-tight">
                                    {parseInt(amount || '0').toLocaleString()}
                                    <span className="text-lg font-medium text-muted-foreground ml-1">원</span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="merchant">가맹점</Label>
                                    <Input id="merchant" placeholder="예: 스타벅스" value={merchant} onChange={(e) => setMerchant(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amount">금액</Label>
                                    <Input id="amount" type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
                                </div>
                            </div>
                        )}
                    </div>

                    <AlertDialogFooter className="flex-row space-x-2 sm:space-x-2">
                        <AlertDialogCancel className="flex-1 h-12 m-0">취소</AlertDialogCancel>
                        <Button onClick={handlePayment} className="flex-1 h-12 btn-gradient m-0">승인</Button>
                    </AlertDialogFooter>
                    </>
                )}
                
                {(paymentStatus === 'activating' || paymentStatus === 'activated' || (paymentStatus === 'idle' && isAutoPay)) && (
                    <div className="flex flex-col items-center justify-center min-h-[300px] space-y-6 perspective-1000">
                    <div 
                        className={cn(
                        "relative w-32 rounded-lg shadow-2xl transform-style-3d transition-all duration-700",
                        (paymentStatus === 'activating' || (paymentStatus === 'idle' && isAutoPay)) && "animate-card-stand-up", 
                        paymentStatus === 'activated' && "scale-110 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                        )}
                        style={{ aspectRatio: '53.98 / 85.6' }} 
                    >
                        <VerticalCardImage
                          src={getActiveItem().cardImage}
                          alt={getActiveItem().name}
                          className="w-full h-full object-cover rounded-lg" 
                        />
                    </div>

                    {(paymentStatus === 'activating' || (paymentStatus === 'idle' && isAutoPay)) && (
                        <div className="flex flex-col items-center space-y-2 text-muted-foreground animate-pulse">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="text-sm font-medium">승인 요청 중...</span>
                        </div>
                    )}
                    {paymentStatus === 'activated' && (
                        <div className="flex flex-col items-center space-y-2 text-green-600 animate-in zoom-in">
                        <CheckCircle className="w-8 h-8" />
                        <span className="text-lg font-bold">결제 완료!</span>
                        </div>
                    )}
                    </div>
                )}
                </AlertDialogContent>
            </AlertDialog>
            ) : (
            <Button className="w-full btn-gradient h-12 text-lg font-bold shadow-lg" onClick={() => navigate('/app/wallet/add')}>
                <Plus className="mr-2 w-5 h-5" />
                카드 등록하기
            </Button>
            )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;