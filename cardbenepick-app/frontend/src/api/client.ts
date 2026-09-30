// src/api/client.ts
import axios from 'axios';

// 환경 변수에서 URL 가져오기 (없으면 로컬 기본값)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// [요청 인터셉터] 토큰 자동 주입
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// [응답 인터셉터] 401 처리 (로그인 만료 시)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 토큰 삭제 및 페이지 이동 로직
      // (React 컴포넌트 밖이라 navigate 훅을 바로 못 쓰므로 window.location 사용)
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);