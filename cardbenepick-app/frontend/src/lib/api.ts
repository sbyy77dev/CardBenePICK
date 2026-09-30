// // frontend/src/lib/api.ts

// export const AUTH_ERROR_EVENT = 'auth:unauthorized';

// export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
//   const token = localStorage.getItem('token');

//   const headers = {
//     'Content-Type': 'application/json',
//     ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
//     ...options.headers,
//   };

//   const response = await fetch(url, {
//     ...options,
//     headers,
//   });

//   // [핵심 수정] 401 발생 시 즉시 처리 (이벤트 방식 -> 직접 이동 방식)
//   if (response.status === 401) {
//     // 1. 토큰 삭제
//     localStorage.removeItem('token');
    
//     // 2. 로그인 페이지로 강제 이동 (가장 확실한 방법)
//     window.location.href = '/login';
    
//     // 3. 로직 중단
//     throw new Error('Session expired or invalid');
//   }

//   return response;
// };

import axios from 'axios';

// [설정] 백엔드 주소 (환경변수 VITE_API_URL이 없으면 로컬 주소 사용)
// ⚠️ 주의: 메인 백엔드가 8000번 포트에서 /api/v1 prefix를 쓰는지, 안 쓰는지에 따라 주소를 맞춰주세요.
// 현재 백엔드 코드상 /api/v1이 아니라면 'http://localhost:8000' 이라고 적어야 할 수도 있습니다.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'; 

// 1. axios 인스턴스 생성 ('api'라는 이름으로 export)
// 다른 파일에서 import { api } from '@/lib/api'; 로 불러와서 씁니다.
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials: true, // 쿠키/세션 방식 인증을 쓴다면 주석 해제
});

// 2. 요청 인터셉터 (Request Interceptor)
// API 요청을 보낼 때마다 저장된 토큰(token)을 헤더에 자동으로 붙여줍니다.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. 응답 인터셉터 (Response Interceptor)
// 서버에서 401(인증 실패) 응답이 오면 자동으로 로그아웃 처리하고 로그인 페이지로 보냅니다.
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 401 Unauthorized 에러 발생 시 처리
    if (error.response && error.response.status === 401) {
      console.warn('⚠️ 세션이 만료되었거나 인증되지 않았습니다. 로그인 페이지로 이동합니다.');
      
      // 토큰 삭제
      localStorage.removeItem('token');
      
      // 로그인 페이지로 강제 이동 (window.location을 쓰면 확실하게 이동함)
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// (선택사항) 기존 fetchWithAuth 함수가 꼭 필요하다면 아래에 남겨둘 수 있습니다.
// 하지만 api 객체를 주로 쓴다면 없어도 됩니다.
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    // 호환성을 위해 남겨둔 함수 (내부적으로는 api 인스턴스 로직과 비슷하게 구현하거나 axios를 래핑해도 됨)
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Session expired');
    }
    return response;
};