/** @type {import('next').NextConfig} */
const nextConfig = {
  // 원격 이미지(스토리지/외부 URL)를 <img> 로 직접 렌더하므로 next/image 도메인 설정은 불필요.
  // Supabase Storage 연동(스테이지 ④) 시 next/image 로 전환하면 여기에 remotePatterns 를 추가한다.
  reactStrictMode: true,
};

export default nextConfig;
