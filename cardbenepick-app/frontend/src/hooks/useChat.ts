import { useMutation } from '@tanstack/react-query';
import { chatApi } from '@/api/chat';

export const useChatMutation = () => {
  return useMutation({
    mutationFn: chatApi.sendMessage,
  });
};