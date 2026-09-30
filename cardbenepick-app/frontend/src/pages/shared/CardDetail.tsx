import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, CreditCard, Loader2, AlertCircle, 
  ShoppingBag, Coffee, Plane, Gift, Smartphone, 
  ShoppingCart, Bus, Fuel, MousePointer2, Ticket, Utensils,
  Stethoscope, GraduationCap, Wifi, Landmark, Globe, Gamepad2, Dumbbell, Zap, Check
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { fetchWithAuth } from '@/lib/api';
import { cn } from '@/lib/utils';

// [아이콘 매핑]
const getCategoryIcon = (category: string) => {
  const cat = category?.toLowerCase() || '';
  
  if (cat.includes('공과금') || cat.includes('관리비') || cat.includes('전기') || cat.includes('가스')) return <Zap className="w-5 h-5" />;
  if (cat.includes('통신') || cat.includes('phone') || cat.includes('sk') || cat.includes('kt') || cat.includes('lg')) return <Smartphone className="w-5 h-5" />;
  if (cat.includes('인터넷') || cat.includes('tv') || cat.includes('스트리밍')) return <Wifi className="w-5 h-5" />;
  if (cat.includes('주유') || cat.includes('gas') || cat.includes('충전') || cat.includes('정비')) return <Fuel className="w-5 h-5" />;
  if (cat.includes('교통') || cat.includes('택시') || cat.includes('버스') || cat.includes('지하철') || cat.includes('코레일')) return <Bus className="w-5 h-5" />;
  if (cat.includes('항공') || cat.includes('마일리지') || cat.includes('공항') || cat.includes('라운지')) return <Plane className="w-5 h-5" />;
  if (cat.includes('해외') || cat.includes('직구') || cat.includes('global')) return <Globe className="w-5 h-5" />;
  if (cat.includes('마트') || cat.includes('편의점') || cat.includes('이마트') || cat.includes('홈플러스')) return <ShoppingCart className="w-5 h-5" />;
  if (cat.includes('온라인') || cat.includes('페이') || cat.includes('쇼핑') || cat.includes('쿠팡') || cat.includes('네이버') || cat.includes('11번가')) return <MousePointer2 className="w-5 h-5" />;
  if (cat.includes('백화점') || cat.includes('아울렛') || cat.includes('면세점')) return <ShoppingBag className="w-5 h-5" />;
  if (cat.includes('커피') || cat.includes('카페') || cat.includes('스타벅스') || cat.includes('투썸')) return <Coffee className="w-5 h-5" />;
  if (cat.includes('음식') || cat.includes('푸드') || cat.includes('배달') || cat.includes('요기요') || cat.includes('배민')) return <Utensils className="w-5 h-5" />;
  if (cat.includes('영화') || cat.includes('문화') || cat.includes('ott') || cat.includes('넷플릭스') || cat.includes('cgv')) return <Ticket className="w-5 h-5" />;
  if (cat.includes('병원') || cat.includes('약국') || cat.includes('의료')) return <Stethoscope className="w-5 h-5" />;
  if (cat.includes('학원') || cat.includes('교육') || cat.includes('서점') || cat.includes('학습') || cat.includes('도서')) return <GraduationCap className="w-5 h-5" />;
  if (cat.includes('골프') || cat.includes('헬스') || cat.includes('피트니스') || cat.includes('운동') || cat.includes('스포츠')) return <Dumbbell className="w-5 h-5" />;
  if (cat.includes('게임') || cat.includes('pc방') || cat.includes('넥슨')) return <Gamepad2 className="w-5 h-5" />;
  if (cat.includes('금융') || cat.includes('은행') || cat.includes('수수료')) return <Landmark className="w-5 h-5" />;
  if (cat.includes('선택') || cat.includes('적립') || cat.includes('할인') || cat.includes('패키지')) return <Check className="w-5 h-5" />;

  return <Gift className="w-5 h-5" />;
};

interface CardBenefit {
  benefit_id: number;
  category: string;
  summary: string;
  detail: any;
}

interface CardDetailData {
  card_id: string;
  card_name: string;
  card_company: string;
  card_image_url: string;
  benefits: CardBenefit[];
}

const CardDetail = () => {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const [isOwned, setIsOwned] = useState(false);
  const [card, setCard] = useState<CardDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCardDetail = async () => {
      try {
        if (!cardId) return;
        setLoading(true);

        const safeId = encodeURIComponent(cardId);

        const [productRes, assetsRes] = await Promise.all([
             fetchWithAuth(`http://localhost:8000/api/assets/products/${safeId}`),
             fetchWithAuth(`http://localhost:8000/api/assets/`) 
        ]);
        
        if (productRes.ok) {
          const productData = await productRes.json();
          setCard(productData);

          if (assetsRes.ok) {
             const myAssets = await assetsRes.json();
             const found = myAssets.find((asset: any) => 
                asset.external_account_id === productData.card_id ||
                asset.external_account_name === productData.card_name ||
                asset.institution_name === productData.card_company 
             );
             if (found) setIsOwned(true);
          }
        } else {
          setError('카드 정보를 불러올 수 없습니다.');
        }
      } catch (err) {
        setError('서버 통신 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchCardDetail();
  }, [cardId]);

  const processBenefits = (benefits: CardBenefit[] | undefined) => {
    if (!benefits || !Array.isArray(benefits)) return { groupedBenefits: [], noticeBenefit: null };

    const noticeBenefit = benefits.find(b => b.category === '유의사항');
    const displayBenefits = benefits.filter(b => b.category !== '유의사항');

    const groups: { [key: string]: CardBenefit[] } = {};
    displayBenefits.forEach(benefit => {
      const cat = benefit.category ? benefit.category.trim() : '기타';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(benefit);
    });

    return {
        groupedBenefits: Object.entries(groups),
        noticeBenefit
    };
  };

  const renderTableFromString = (rawString: string) => {
    const cleanString = rawString.replace(/^table\s*:\s*/i, '').trim();
    const items = cleanString.split(',').map(item => item.trim()).filter(item => item !== '');

    const headers = items.slice(0, 3);
    const bodyItems = items.slice(3);

    const rows: string[][] = [];
    let currentRow: string[] = [];
    
    bodyItems.forEach((item) => {
        if (item.startsWith('패키지')) {
            if (currentRow.length > 0) rows.push(currentRow);
            currentRow = [item];
        } else {
            currentRow.push(item);
        }
    });
    if (currentRow.length > 0) rows.push(currentRow);

    return (
      <div className="overflow-hidden rounded-lg border border-gray-200 mt-3 mb-3 shadow-sm bg-white">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-100 font-bold text-gray-700 border-b border-gray-200">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className={cn("px-2 py-3 text-center align-middle", i < headers.length -1 && "border-r border-gray-200")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="px-2 py-3 text-center font-bold text-blue-600 border-r border-gray-100 align-middle whitespace-nowrap">
                   {row[0]}
                </td>
                <td className="px-2 py-3 text-center text-gray-700 border-r border-gray-100 align-middle">
                   {row[1] || '-'}
                </td>
                <td className="px-3 py-3 text-gray-600 align-middle leading-relaxed">
                   {row.slice(2).map((txt, i) => <div key={i}>{txt}</div>)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // [핵심] 정규화 함수: 특수문자만 제거하고 '단어'는 살립니다. (청구, 할인 등 보존)
  const normalizeText = (text: string) => {
      return text
        .replace(/\[.*?\]/g, '') // 대괄호 태그 제거 [라이프스타일]
        .replace(/[.,…\-\s•·*]/g, '') // 점, 콤마, 공백, 불렛만 제거
        .trim();
  };

  // [데이터 검증기]
  const isValidBenefit = (benefit: CardBenefit) => {
      if (!benefit.detail) return false;

      let textToCheck = '';
      if (typeof benefit.detail === 'string') {
          textToCheck = benefit.detail;
      } else {
          textToCheck = JSON.stringify(benefit.detail);
      }

      // 1. 글자 없으면 삭제
      const cleanText = textToCheck.replace(/[^a-zA-Z0-9가-힣]/g, '');
      if (cleanText.length === 0) return false;

      return true;
  };

  // [렌더링 로직]
  const renderBenefitDetail = (detail: any, parentSummary: string = '') => {
    if (!detail) return null;

    if (typeof detail === 'string') {
        if (detail.trim().startsWith('table')) return renderTableFromString(detail);
        try {
            const parsed = JSON.parse(detail);
            if (typeof parsed === 'object') return renderBenefitDetail(parsed, parentSummary);
        } catch {}
        
        const cleanStr = normalizeText(detail);
        if (!cleanStr) return null; 

        // [중복 체크]
        if (parentSummary) {
            const cleanParent = normalizeText(parentSummary);
            // 내용이 부모 제목에 포함되면 중복 (예: '통신10%할인'은 '라이프스타일통신10%할인'에 포함됨 -> 삭제)
            // 단! '청구' 같은 중요한 단어가 내용에 있으면 삭제 안 함 (근데 통신은 '청구'가 없어도 내용이 같아서 삭제됨)
            // -> 통신 10% 청구할인 (내용) vs 통신 10% 할인 (제목) -> 서로 다름 -> 유지!
            // -> 통신 10% 할인 (내용) vs 통신 10% 할인 (제목) -> 같음 -> 삭제!
            if (cleanParent.includes(cleanStr) || cleanStr.includes(cleanParent)) return null;
        }

        return <div className="text-sm text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{__html: detail}} />;
    }

    const sections = Array.isArray(detail) ? detail : [detail];

    return (
      <div className="space-y-4">
        {sections.map((section: any, idx: number) => {
          if (!section) return null;

          if (typeof section === 'string') {
              if (section.trim().startsWith('table')) return <div key={idx}>{renderTableFromString(section)}</div>;
              
              const cleanStr = normalizeText(section);
              if (!cleanStr) return null;

              if (parentSummary) {
                  const cleanParent = normalizeText(parentSummary);
                  // [중복 체크]
                  if (cleanParent.includes(cleanStr) || cleanStr.includes(cleanParent)) return null;
              }

              return (
                <div key={idx} className="text-xs text-gray-600 leading-relaxed pl-2.5 relative">
                    <span className="absolute left-0 top-2 w-1 h-1 bg-gray-400 rounded-full"></span>
                    {section}
                </div>
             );
          }

          // 객체 처리
          const title = section.title || section.subtitle || section.service_name || section.benefit_name || '';
          
          let descs: any[] = [];
          if (Array.isArray(section.descriptions)) descs = section.descriptions;
          else if (section.content) descs = [section.content];
          else if (section.detail) descs = [section.detail];
          else if (section.service_desc) descs = [section.service_desc];
          else if (section.options) descs = section.options;

          if (descs.length === 0) {
             const values = Object.values(section).filter(v => typeof v === 'string');
             if (values.length > 0) descs = values;
          }

          const validDescs = descs.filter((desc: any) => {
              const text = typeof desc === 'object' ? JSON.stringify(desc) : String(desc);
              const normText = normalizeText(text);
              if (!normText) return false;

              if (title) {
                  const normTitle = normalizeText(title);
                  if (normTitle.includes(normText) || normText.includes(normTitle)) return false;
              }
              if (parentSummary) {
                  const normParent = normalizeText(parentSummary);
                  if (normParent.includes(normText) || normText.includes(normParent)) return false;
              }
              return true;
          });

          // 제목만 있고 내용이 없으면? -> 제목이라도 보여줘야 함 (예: '통신 10% 청구할인')
          // 하지만 '통신 10% 할인' 같은 중복 제목은 숨겨야 함.
          let showTitle = true;
          if (title && parentSummary) {
              const normTitle = normalizeText(title);
              const normParent = normalizeText(parentSummary);
              if (normParent.includes(normTitle) || normTitle.includes(normParent)) showTitle = false;
          }

          if (!showTitle && validDescs.length === 0) return null;

          return (
            <div key={idx} className="space-y-2">
              {/* [수정] 첫 번째 줄이 제목 역할이면 진하게, 아니면 그냥 둠 */}
              {showTitle && title && <h4 className="font-bold text-gray-900 text-sm">{title}</h4>}
              
              {validDescs.length > 0 && (
                <div className="space-y-1.5">
                  {validDescs.map((desc: any, i: number) => {
                    const text = typeof desc === 'object' ? JSON.stringify(desc) : String(desc);
                    
                    if (text.trim().includes('table :') || text.trim().startsWith('table')) {
                        return <div key={i}>{renderTableFromString(text)}</div>;
                    }

                    // [스타일링] 리스트의 첫 번째 항목이고, 특수문자로 시작하지 않으면 '소제목'처럼 진하게 표시
                    const isHeaderLike = i === 0 && !text.trim().match(/^[-*•]/); 
                    
                    const cleanText = text.replace(/[{}"[\]]/g, ' ').trim();
                    return (
                        <div key={i} className={cn(
                            "text-xs leading-relaxed pl-2.5 relative",
                            isHeaderLike ? "font-bold text-gray-900 mb-1" : "text-gray-600"
                        )}>
                           {!isHeaderLike && <span className="absolute left-0 top-2 w-1 h-1 bg-gray-400 rounded-full"></span>}
                           {cleanText}
                        </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderNoticeContent = (detail: any) => {
    if (!detail) return null;
    const sections = Array.isArray(detail) ? detail : [detail];
    return (
      <div className="space-y-3">
        {sections.map((section: any, idx: number) => {
          let descs = [];
          if (typeof section === 'string') descs = [section];
          else descs = section.descriptions || (section.content ? [section.content] : []) || (section.detail ? [section.detail] : []) || [];
          
          return (
            <ul key={idx} className="list-disc pl-4 space-y-2 marker:text-gray-400 text-xs">
              {descs.map((desc: any, i: number) => <li key={i}>{String(desc)}</li>)}
            </ul>
          );
        })}
      </div>
    );
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (error || !card) {
    return (
      <div className="flex flex-col h-screen items-center justify-center gap-4 bg-white">
        <AlertCircle className="w-12 h-12 text-gray-300" />
        <p className="text-muted-foreground">{error || '카드를 찾을 수 없습니다.'}</p>
        <Button onClick={() => navigate(-1)}>뒤로 가기</Button>
      </div>
    );
  }

  const { groupedBenefits, noticeBenefit } = processBenefits(card.benefits);

  return (
    <div className={cn("bg-gray-50 min-h-screen relative max-w-[448px] mx-auto shadow-xl", !isOwned ? "pb-28" : "pb-10")}>
      <div className="sticky top-0 z-10 flex items-center p-4 bg-white border-b shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-3">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">카드 상세정보</h1>
      </div>

      <div className="bg-white pb-10 pt-8 px-6 mb-3 border-b border-gray-100">
        <div className="flex flex-col items-center">
          <div className="w-40 h-auto mb-6 drop-shadow-2xl transition-transform hover:scale-105 duration-300">
            <img 
              src={card.card_image_url} 
              alt={card.card_name}
              className="w-full h-full object-contain rounded-xl"
              onError={(e) => { e.currentTarget.src = "http://localhost:8080/placeholder.svg"; }}
            />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{card.card_name}</h2>
            <p className="text-sm text-gray-500 font-medium">{card.card_company}</p>
          </div>
        </div>
      </div>

      <div className="bg-white px-4 py-2 mb-3">
        <h3 className="text-lg font-bold px-2 py-4 text-gray-900">주요 혜택</h3>
        {groupedBenefits.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {groupedBenefits.map(([category, benefits], index) => {
              
              const validBenefits = benefits.filter(isValidBenefit);
              if (validBenefits.length === 0) return null;

              return (
                <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-100 last:border-0">
                  <AccordionTrigger className="hover:no-underline py-5 px-2 group">
                    <div className="flex items-center text-left gap-4 w-full">
                      <div className="flex-shrink-0 p-2.5 bg-blue-50 rounded-2xl text-blue-600 group-data-[state=open]:bg-blue-100 transition-colors">
                        {getCategoryIcon(category)}
                      </div>
                      <div className="flex-1">
                        <span className="text-base font-bold text-gray-800 block mb-1">
                          {category}
                        </span>
                        <span className="text-sm text-gray-500 font-normal block line-clamp-1">
                          {validBenefits[0].summary || `${validBenefits.length}개의 상세 혜택`}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="bg-gray-50/80 rounded-lg mb-2 mx-2">
                    <div className="p-5 space-y-8">
                      {validBenefits.map((benefit, bIndex) => (
                        <div key={bIndex} className={cn("space-y-3", bIndex > 0 && "pt-6")}>
                          
                          {/* [수정] 제목(h5) 제거! */}
                          {/* 드럭스토어처럼 깔끔하게 내용만 보여줍니다. */}
                          {/* {benefit.summary && ( ... )} 이 부분을 삭제했습니다. */}

                          {renderBenefitDetail(benefit.detail, benefit.summary)}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
          <div className="text-center py-12 text-gray-400 bg-white rounded-lg border border-dashed">
            등록된 혜택 정보가 없습니다.
          </div>
        )}
      </div>

      <div className="px-6 py-8 bg-[#F5F6F8] text-gray-500 leading-relaxed space-y-4 border-t border-gray-200 mb-10">
        <div className="flex items-center gap-2 text-gray-800 mb-1">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-bold text-sm">유의사항</p>
        </div>
        
        {noticeBenefit ? renderNoticeContent(noticeBenefit.detail) : (
           <ul className="list-disc pl-4 space-y-2 marker:text-gray-400 text-xs">
             <li>상세 혜택 및 이용 조건은 카드를 발급받기 전에 상품설명서 및 약관 등을 통해 반드시 확인하시기 바랍니다.</li>
             <li>신용카드 발급이 부적정한 경우(개인신용평점 낮음 등) 카드발급이 제한될 수 있습니다.</li>
           </ul>
        )}
      </div>

      {!isOwned && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-20">
          <div className="max-w-md mx-auto">
              <Button 
                  className="w-full btn-gradient h-14 text-lg font-bold shadow-lg rounded-xl transition-transform active:scale-[0.98]"
                  onClick={() => {
                      window.open("https://pc.wooricard.com/dcpc/yh1/crd/crd01/H1CRD101S02.do", "_blank");
                  }}
              >
                  <CreditCard className="w-5 h-5 mr-2" />
                  온라인 신청하기
              </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardDetail;