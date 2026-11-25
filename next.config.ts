import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 테스트 서버(next dev, 3100)와 build 가 .next 를 같이 쓰면 서로 깨뜨린다 → 테스트 서버는 별도 dir
  distDir: process.env.APP_TEST_MODE === "1" ? ".next-test" : ".next",
  // dev 에서 effect 가 두 번 돌면 fail-next·delay-next(다음 1회 요청)가 첫 요청에서 소진된다
  reactStrictMode: false,
  transpilePackages: ["@astryxdesign/core", "@astryxdesign/theme-neutral"],
};

export default nextConfig;
