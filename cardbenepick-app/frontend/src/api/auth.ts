import { client } from './client';

export const authApi = {
  // OTP 발송
  sendOtp: async (phoneNumber: string) => {
    const response = await client.post('/auth/send-otp', { phone_number: phoneNumber });
    return response.data;
  },

  // OTP 검증
  verifyOtp: async (phoneNumber: string, otp: string) => {
    const response = await client.post('/auth/verify-otp', { phone_number: phoneNumber, otp });
    return response.data; // { token, is_new_user }
  },

  // 회원가입 완료
  register: async (data: {
    name: string;
    telecom: string;
    birth_date: string;
    gender: string;
    agreed_terms: boolean;
    agreed_privacy: boolean;
  }) => {
    const response = await client.post('/auth/complete-registration', data);
    return response.data;
  },
};