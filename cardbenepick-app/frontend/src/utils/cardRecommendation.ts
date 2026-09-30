import { Card, PaymentQuery, CardRecommendation, BenefitCategory, SurveyResponse, UserGroup } from '../types';
import { sampleCards, userGroups, benefitCategoryNames } from '../data/mockData';

// 카드 추천 로직
export const getCardRecommendations = (query: PaymentQuery, userCards: Card[] = []): CardRecommendation[] => {
  const recommendations: CardRecommendation[] = [];
  
  // 1. 최고 혜택 카드 찾기
  const bestBenefitCard = findBestBenefitCard(query, userCards);
  if (bestBenefitCard) {
    recommendations.push(bestBenefitCard);
  }
  
  // 2. 실적 충족이 필요한 카드 찾기
  const performanceNeededCard = findPerformanceNeededCard(userCards, query.amount);
  if (performanceNeededCard) {
    recommendations.push(performanceNeededCard);
  }
  
  // 3. 추가 추천 카드
  const additionalCard = findAdditionalRecommendation(query, userCards);
  if (additionalCard) {
    recommendations.push(additionalCard);
  }
  
  return recommendations;
};

const findBestBenefitCard = (query: PaymentQuery, userCards: Card[]): CardRecommendation | null => {
  const availableCards = userCards.length > 0 ? userCards : sampleCards;
  let bestCard: Card | null = null;
  let maxBenefit = 0;
  
  availableCards.forEach(card => {
    const benefit = calculateBenefit(card, query);
    if (benefit > maxBenefit) {
      maxBenefit = benefit;
      bestCard = card;
    }
  });
  
  if (!bestCard) return null;
  
  return {
    card: bestCard,
    reason: `${query.merchant}에서 ${maxBenefit.toLocaleString()}원의 혜택을 받을 수 있습니다.`,
    expectedBenefit: maxBenefit,
    type: 'best_benefit'
  };
};

const findPerformanceNeededCard = (userCards: Card[], amount: number): CardRecommendation | null => {
  // 실제로는 사용자의 카드별 실적 데이터를 확인해야 함
  // 여기서는 샘플 로직으로 구현
  if (userCards.length === 0) return null;
  
  const needsPerformanceCard = userCards[Math.floor(Math.random() * userCards.length)];
  const remainingAmount = Math.floor(Math.random() * 100000) + 50000;
  
  return {
    card: needsPerformanceCard,
    reason: `이번 달 실적 달성까지 ${remainingAmount.toLocaleString()}원 남았습니다.`,
    expectedBenefit: amount * 0.02, // 2% 가정
    type: 'performance_needed'
  };
};

const findAdditionalRecommendation = (query: PaymentQuery, userCards: Card[]): CardRecommendation | null => {
  const availableCards = sampleCards.filter(card => 
    !userCards.some(userCard => userCard.id === card.id)
  );
  
  if (availableCards.length === 0) return null;
  
  const recommendedCard = availableCards[0]; // 간단한 로직
  
  return {
    card: recommendedCard,
    reason: '새로운 카드로 더 많은 혜택을 받아보세요.',
    expectedBenefit: calculateBenefit(recommendedCard, query),
    type: 'additional_recommendation'
  };
};

const calculateBenefit = (card: Card, query: PaymentQuery): number => {
  const relevantBenefits = card.benefits.filter(benefit => 
    !query.category || benefit.category === query.category
  );
  
  if (relevantBenefits.length === 0) return 0;
  
  const benefit = relevantBenefits[0];
  let calculatedBenefit = 0;
  
  if (benefit.cashbackRate) {
    calculatedBenefit = query.amount * (benefit.cashbackRate / 100);
  } else if (benefit.discountRate) {
    calculatedBenefit = query.amount * (benefit.discountRate / 100);
  } else if (benefit.pointRate) {
    calculatedBenefit = query.amount * (benefit.pointRate / 100);
  }
  
  // 최대 혜택 한도 적용
  if (benefit.maxDiscount && calculatedBenefit > benefit.maxDiscount) {
    calculatedBenefit = benefit.maxDiscount;
  }
  
  return Math.floor(calculatedBenefit);
};

// 소비 패턴 분석
export const analyzeSpendingPattern = (transactions: any[]) => {
  // 실제로는 거래 내역을 분석하여 카테고리별 소비 패턴을 계산
  // 여기서는 샘플 데이터 반환
  return {
    categories: {
      dining: 25,
      cafe: 15,
      shopping: 20,
      online: 20,
      transport: 10,
      gas: 5,
      grocery: 3,
      entertainment: 1,
      travel: 1,
      utility: 0
    },
    totalMonthly: 850000,
    averageTransaction: 28000
  };
};

// 설문조사 기반 사용자 그룹 매칭
export const matchUserGroup = (surveyResponse: SurveyResponse): UserGroup => {
  // 간단한 매칭 로직 - 실제로는 더 복잡한 알고리즘 사용
  const primaryCategory = surveyResponse.primarySpendingCategory;
  
  if (['online', 'dining'].includes(primaryCategory)) {
    return userGroups[0]; // 온라인 쇼핑족
  } else if (['shopping', 'grocery', 'gas'].includes(primaryCategory)) {
    return userGroups[1]; // 오프라인 소비족
  } else {
    return userGroups[2]; // 라이프스타일 중심족
  }
};

// 카드 조합 추천
export const getCardCombinations = (surveyResponse: SurveyResponse): Card[][] => {
  const combinations: Card[][] = [];
  
  // 선호 카테고리 기반으로 카드 조합 생성
  const preferredCategories = surveyResponse.spendingCategories;
  
  // 조합 1: 최고 혜택 카드들
  const combo1 = sampleCards
    .filter(card => 
      card.benefits.some(benefit => 
        preferredCategories.includes(benefit.category)
      )
    )
    .slice(0, 3);
  
  if (combo1.length > 0) combinations.push(combo1);
  
  // 조합 2: 균형잡힌 혜택 카드들
  const combo2 = sampleCards
    .filter(card => card.category === 'cashback')
    .slice(0, 2);
  
  if (combo2.length > 0) combinations.push(combo2);
  
  // 조합 3: 인기 카드들
  const combo3 = sampleCards
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, 3);
  
  if (combo3.length > 0) combinations.push(combo3);
  
  return combinations.slice(0, 3); // 최대 3개 조합
};

// 카테고리별 소비 금액을 차트 데이터로 변환
export const convertToChartData = (categories: Record<BenefitCategory, number>) => {
  return Object.entries(categories)
    .filter(([_, value]) => value > 0)
    .map(([category, value]) => ({
      name: benefitCategoryNames[category as BenefitCategory],
      value,
      color: getRandomColor()
    }))
    .sort((a, b) => b.value - a.value);
};

const getRandomColor = () => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// 가맹점명으로 카테고리 추측
export const inferCategoryFromMerchant = (merchant: string): BenefitCategory | undefined => {
  const merchantLower = merchant.toLowerCase();
  
  if (merchantLower.includes('스타벅스') || merchantLower.includes('카페') || merchantLower.includes('coffee')) {
    return 'cafe';
  } else if (merchantLower.includes('맥도날드') || merchantLower.includes('치킨') || merchantLower.includes('피자')) {
    return 'dining';
  } else if (merchantLower.includes('gs25') || merchantLower.includes('편의점') || merchantLower.includes('마트')) {
    return 'grocery';
  } else if (merchantLower.includes('지하철') || merchantLower.includes('버스') || merchantLower.includes('택시')) {
    return 'transport';
  } else if (merchantLower.includes('주유소') || merchantLower.includes('gs칼텍스') || merchantLower.includes('sk에너지')) {
    return 'gas';
  } else if (merchantLower.includes('백화점') || merchantLower.includes('아울렛') || merchantLower.includes('쇼핑')) {
    return 'shopping';
  } else if (merchantLower.includes('넷플릭스') || merchantLower.includes('유튜브') || merchantLower.includes('영화')) {
    return 'entertainment';
  }
  
  return undefined;
};