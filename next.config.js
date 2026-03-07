/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Required for Prisma + Neon serverless on Vercel
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  // Ensure NEXTAUTH_URL is set correctly on Vercel
  // (Vercel auto-sets VERCEL_URL but NextAuth needs NEXTAUTH_URL)
}

module.exports = nextConfig
