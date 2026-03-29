import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Супернова — Япон Улсын Жишиг Эмнэлэг',
  description:
    'Японы стандартын дагуу иж бүрэн эрүүл мэндийн шинжилгээ. Цусны шинжилгээ, хэт авиа, дуран болон бусад дэвшилтэт оношлогоо.',
  keywords: 'Супернова, эмнэлэг, шинжилгээ, оношлогоо, Япон, Улаанбаатар',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="mn"
      className="h-full antialiased scroll-smooth"
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col bg-white text-[#1F2937]">
        {children}
      </body>
    </html>
  )
}
