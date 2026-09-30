import { create } from 'zustand';
// import { fetchWithAuth } from '@/lib/api'; // API 유틸리티 임포트
import { cardApi } from '@/api/card';
export interface Asset {
  asset_id: number;
  institution_name: string;
  external_account_id: string;
  external_account_name: string | null;
  asset_type: string;
  created_at: string;
  card_image_url?: string;
}

interface CardState {
  assets: Asset[];
  isLoading: boolean;
  error: string | null;

  fetchAssets: () => Promise<void>;
  removeAsset: (assetId: number) => Promise<void>;
  clearAssets: () => void;
}

export const useCardStore = create<CardState>((set) => ({
  assets: [],
  isLoading: false,
  error: null,

  fetchAssets: async () => {
    set({ isLoading: true, error: null });
    try {
      // [수정 1: fetchWithAuth -> cardApi.getMyCards]
      const data = await cardApi.getMyCards(); 
      
      set({ assets: data });
    } catch (error: any) {
      console.error(error);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  removeAsset: async (assetId: number) => {
    try {
      // [수정 2] fetchWithAuth 사용 & 포트 8000으로 변경
      await fetchWithAuth(`http://localhost:8000/api/assets/${assetId}`, {
        method: 'DELETE',
      });

      set((state) => ({
        assets: state.assets.filter((asset) => asset.asset_id !== assetId)
      }));
    } catch (error: any) {
      console.error(error);
      throw error;
    }
  },

  clearAssets: () => set({ assets: [], error: null })
}));