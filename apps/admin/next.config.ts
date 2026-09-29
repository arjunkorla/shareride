import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@shareride/types', '@shareride/api-client'],
}

export default nextConfig
