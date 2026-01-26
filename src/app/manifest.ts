import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BETT',
    short_name: 'BETT',
    description: 'Two-person goal tracking.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#080a0e',
    theme_color: '#e89840',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/apple-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}

