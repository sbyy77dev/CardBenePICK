import { Card, BenefitCategory, UserGroup, SpendingPattern } from '../types';

// 샘플 카드 데이터
export const sampleCards: Card[] = [
  {
    id: 'card-1',
    name: '삼성카드 taptap O',
    bank: '삼성카드',
    image: '/images/samsung-taptap.jpg',
    annualFee: 0,
    category: 'cashback',
    popularityScore: 95,
    benefits: [
      {
        id: 'benefit-1',
        category: 'online',
        description: '온라인 쇼핑 5% 적립',
        discountRate: 0,
        cashbackRate: 5,
        maxDiscount: 10000,
        conditions: ['월 최대 1만원']
      },
      {
        id: 'benefit-2',
        category: 'transport',
        description: '대중교통 10% 적립',
        discountRate: 0,
        cashbackRate: 10,
        maxDiscount: 5000,
        conditions: ['월 최대 5천원']
      }
    ]
  },
  {
    id: 'card-2',
    name: '신한카드 Deep Dream',
    bank: '신한카드',
    image: '/images/shinhan-deepdream.jpg',
    annualFee: 0,
    category: 'cashback',
    popularityScore: 88,
    benefits: [
      {
        id: 'benefit-3',
        category: 'cafe',
        description: '카페 15% 할인',
        discountRate: 15,
        maxDiscount: 3000,
        conditions: ['월 최대 3천원', '스타벅스, 이디야 등']
      },
      {
        id: 'benefit-4',
        category: 'dining',
        description: '배달앱 10% 할인',
        discountRate: 10,
        maxDiscount: 5000,
        conditions: ['월 최대 5천원']
      }
    ]
  },
  {
    id: 'card-3',
    name: '현대카드 M',
    bank: '현대카드',
    image: '/images/hyundai-m.jpg',
    annualFee: 0,
    category: 'points',
    popularityScore: 92,
    benefits: [
      {
        id: 'benefit-5',
        category: 'shopping',
        description: '백화점 5% 적립',
        discountRate: 0,
        pointRate: 5,
        maxDiscount: 20000,
        conditions: ['월 최대 2만원']
      },
      {
        id: 'benefit-6',
        category: 'gas',
        description: '주유 3% 적립',
        discountRate: 0,
        pointRate: 3,
        maxDiscount: 10000,
        conditions: ['월 최대 1만원']
      }
    ]
  },
  {
    id: 'card-4',
    name: 'KB국민 WE:ON',
    bank: 'KB국민카드',
    image: '/images/kb-weon.jpg',
    annualFee: 0,
    category: 'cashback',
    popularityScore: 85,
    benefits: [
      {
        id: 'benefit-7',
        category: 'grocery',
        description: '마트 5% 적립',
        discountRate: 0,
        cashbackRate: 5,
        maxDiscount: 10000,
        conditions: ['월 최대 1만원']
      },
      {
        id: 'benefit-8',
        category: 'utility',
        description: '통신비 10% 적립',
        discountRate: 0,
        cashbackRate: 10,
        maxDiscount: 5000,
        conditions: ['월 최대 5천원']
      }
    ]
  },
  {
    id: 'card-5',
    name: '우리카드 MY WE:LIKE',
    bank: '우리카드',
    image: '/images/woori-welike.jpg',
    annualFee: 0,
    category: 'cashback',
    popularityScore: 80,
    benefits: [
      {
        id: 'benefit-9',
        category: 'entertainment',
        description: 'OTT 서비스 30% 할인',
        discountRate: 30,
        maxDiscount: 3000,
        conditions: ['월 최대 3천원', '넷플릭스, 디즈니+ 등']
      },
      {
        id: 'benefit-10',
        category: 'travel',
        description: '항공료 3% 적립',
        discountRate: 0,
        cashbackRate: 3,
        maxDiscount: 30000,
        conditions: ['월 최대 3만원']
      }
    ]
  }
];

// 사용자 그룹 데이터
export const userGroups: UserGroup[] = [
  {
    id: 'group-1',
    name: '온라인 쇼핑족',
    characteristics: ['온라인 쇼핑 선호', '배달음식 자주 이용', '디지털 결제 선호'],
    popularCards: sampleCards.slice(0, 2),
    spendingPattern: {
      categories: {
        online: 35,
        dining: 25,
        cafe: 15,
        transport: 10,
        shopping: 8,
        gas: 3,
        grocery: 2,
        entertainment: 1,
        travel: 1,
        utility: 0
      },
      totalMonthly: 800000,
      averageTransaction: 25000
    }
  },
  {
    id: 'group-2',
    name: '오프라인 소비족',
    characteristics: ['백화점/마트 쇼핑 선호', '주유 빈번', '현금/카드 병행 사용'],
    popularCards: [sampleCards[2], sampleCards[3]],
    spendingPattern: {
      categories: {
        shopping: 30,
        grocery: 25,
        gas: 20,
        dining: 10,
        cafe: 5,
        transport: 5,
        online: 3,
        entertainment: 1,
        travel: 1,
        utility: 0
      },
      totalMonthly: 1200000,
      averageTransaction: 45000
    }
  },
  {
    id: 'group-3',
    name: '라이프스타일 중심족',
    characteristics: ['카페 자주 이용', 'OTT/구독 서비스 다수', '여행 선호'],
    popularCards: [sampleCards[1], sampleCards[4]],
    spendingPattern: {
      categories: {
        cafe: 25,
        entertainment: 20,
        travel: 20,
        dining: 15,
        online: 10,
        transport: 5,
        shopping: 3,
        grocery: 1,
        gas: 1,
        utility: 0
      },
      totalMonthly: 900000,
      averageTransaction: 30000
    }
  }
];

// 혜택 카테고리 한글 매핑
export const benefitCategoryNames: Record<BenefitCategory, string> = {
  dining: '음식점',
  cafe: '카페',
  shopping: '쇼핑',
  gas: '주유',
  transport: '교통',
  online: '온라인',
  grocery: '마트',
  entertainment: '엔터테인먼트',
  travel: '여행',
  utility: '통신/공과금'
};

// 혜택 카테고리 색상 매핑
export const benefitCategoryColors: Record<BenefitCategory, string> = {
  dining: '#FF6B6B',
  cafe: '#4ECDC4',
  shopping: '#45B7D1',
  gas: '#96CEB4',
  transport: '#FFEAA7',
  online: '#DDA0DD',
  grocery: '#98D8C8',
  entertainment: '#F7DC6F',
  travel: '#BB8FCE',
  utility: '#85C1E9'
};

// 챗봇 응답 템플릿
export const chatbotResponses = {
  greeting: '안녕하세요! 카드 혜택 추천 서비스입니다. 어떤 도움이 필요하신가요?',
  askMerchant: '어떤 가맹점에서 결제하실 예정인가요?',
  askAmount: '결제 예정 금액을 알려주세요.',
  processing: '최적의 카드를 찾고 있습니다...',
  noCards: '죄송합니다. 현재 등록된 카드가 없습니다.',
  error: '오류가 발생했습니다. 다시 시도해주세요.'
};

// 설문조사 질문
export const surveyQuestions = [
  {
    id: 'spending-categories',
    question: '주로 어떤 분야에서 소비하시나요? (복수 선택 가능)',
    type: 'multiple',
    options: Object.entries(benefitCategoryNames).map(([key, value]) => ({
      value: key,
      label: value
    }))
  },
  {
    id: 'monthly-budget',
    question: '한 달 평균 카드 사용 금액은 얼마인가요?',
    type: 'single',
    options: [
      { value: '300000', label: '30만원 이하' },
      { value: '500000', label: '30-50만원' },
      { value: '800000', label: '50-80만원' },
      { value: '1200000', label: '80-120만원' },
      { value: '1500000', label: '120만원 이상' }
    ]
  },
  {
    id: 'benefit-preference',
    question: '어떤 혜택을 선호하시나요?',
    type: 'single',
    options: [
      { value: 'single_big', label: '하나의 큰 혜택' },
      { value: 'multiple_small', label: '여러 개의 작은 혜택' }
    ]
  },
  {
    id: 'primary-category',
    question: '가장 많이 소비하는 분야는 무엇인가요?',
    type: 'single',
    options: Object.entries(benefitCategoryNames).map(([key, value]) => ({
      value: key,
      label: value
    }))
  }
];