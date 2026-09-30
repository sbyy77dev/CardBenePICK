import axios from 'axios';

// Agent 서버 주소 (환경변수 또는 기본값 8090)
const AGENT_BASE_URL = import.meta.env.VITE_AGENT_API_URL || 'http://localhost:8090';

export const agentClient = axios.create({
  baseURL: AGENT_BASE_URL,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

// 요청 인터셉터: 토큰 자동 주입
agentClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});