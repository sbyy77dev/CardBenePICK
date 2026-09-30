// frontend/src/lib/constants.ts

// VITE_IMAGE_BASE_URL는 현재 도메인(localhost:5173)의 /images 를 가리킵니다.
export const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || '/images'; 

// placeholder.svg 경로 (public 폴더 루트에 있으므로)
export const PLACEHOLDER_IMAGE_URL = '/placeholder.svg';