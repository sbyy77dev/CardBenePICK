import { agentClient } from './agentClient';

export interface ChatResponse {
  response: string; // JSON 문자열 또는 일반 텍스트
  // 필요한 경우 다른 필드 추가
}

export const chatApi = {
  sendMessage: async (query: string) => {
    // x-www-form-urlencoded 형식으로 데이터 전송
    const params = new URLSearchParams();
    params.append('query', query);
    
    const response = await agentClient.post<ChatResponse>('/chat_react', params);
    return response.data;
  },
};