import { useState } from 'react';

// 이미지 회전 처리 컴포넌트
const AutoOrientedCardImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
  const [isLandscape, setIsLandscape] = useState(false);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    // 가로가 더 길면 세로로 회전
    if (naturalWidth > naturalHeight) {
      setIsLandscape(true);
    }
  };

  return (
    <img
      src={src}
      alt={alt}
      onLoad={handleImageLoad}  // 이미지 로드 후 크기 확인
      className={className}
style={{
        // 이미지 비율을 유지하면서 부모 컨테이너에 맞춥니다.
        objectFit: 'contain',
        transition: 'transform 0.3s ease',
        transformOrigin: 'center center',

        // ★★★ 이 부분이 핵심 수정 사항입니다 ★★★
        // 1. 부모 컨테이너 안에 위치시킵니다.
        position: 'absolute', // 부모 div (w-24 bg-gray-50)에 relative를 줘야 함 (아래 참조)
        top: '50%',
        left: '50%',

        // 2. 회전 상태에 따라 크기와 위치를 조정합니다.
        transform: isLandscape 
          ? 'translate(-50%, -50%) rotate(90deg)' // 중앙 정렬 후 90도 회전
          : 'translate(-50%, -50%) rotate(0deg)', // 중앙 정렬
 
        // 3. 부모 컨테이너의 더 긴 변(높이)에 회전된 이미지의 길이가 맞춰지도록 width/height 설정
        width: isLandscape ? '100%' : '100%', // 회전 후에는 width가 컨테이너 높이에 대응
        height: isLandscape ? '100%' : '100%',
      }}
      onError={(e) => { 
        e.currentTarget.src = '/placeholder.svg';  // 이미지 로드 실패 시 기본 이미지
      }}
    />
  );
};
export default AutoOrientedCardImage;