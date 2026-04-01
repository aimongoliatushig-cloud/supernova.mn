import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'СУПЕРНОВА эмнэлэг',
    short_name: 'SUPERNOVA',
    description:
      'Япон стандартын эрт илрүүлэг, урьдчилан сэргийлэх үзлэг, оношилгоо, цаг захиалга болон эрүүл мэндийн зөвлөгөө.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#0D2542',
    lang: 'mn',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
