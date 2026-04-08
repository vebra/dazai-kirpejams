import type { NextConfig } from 'next'

/**
 * Supabase Storage paveikslėlių host'as — ištraukiam iš URL aplinkos
 * kintamojo, kad remote images veiktų bet kurioje aplinkoje.
 */
function getSupabaseHost(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url || url.includes('your-supabase')) return null
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

const supabaseHost = getSupabaseHost()

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage
      ...(supabaseHost
        ? [
            {
              protocol: 'https' as const,
              hostname: supabaseHost,
              pathname: '/storage/v1/object/public/**',
            },
          ]
        : []),
      // Bendras fallback — visi Supabase project'ai (gamybinei aplinkai,
      // kol NEXT_PUBLIC_SUPABASE_URL dar nenurodytas build'o metu)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
