export const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
    const decoded = parseJwt(token);
    if (!decoded || !decoded.exp) return true;
    
    // exp는 초 단위, Date.now()는 밀리초 단위이므로 1000을 곱해 비교
    return decoded.exp * 1000 < Date.now();
};

export const getTimeLeft = (token: string): number => {
    const decoded = parseJwt(token);
    if (!decoded || !decoded.exp) return 0;
    
    // 남은 시간(밀리초) 반환
    return (decoded.exp * 1000) - Date.now();
};