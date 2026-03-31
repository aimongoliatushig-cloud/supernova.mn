import type { Metadata } from 'next'
import { Noto_Sans } from 'next/font/google'
import './globals.css'

const notoSans = Noto_Sans({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'СУПЕРНОВА | Япон Улсын Жишиг Эмнэлэг',
  description:
    'Япон стандартын эрт илрүүлэг, урьдчилан сэргийлэх үзлэг, оношилгоо, цаг захиалга болон эрүүл мэндийн зөвлөгөө.',
  keywords: [
    'СУПЕРНОВА',
    'эмнэлэг',
    'эрт илрүүлэг',
    'оношилгоо',
    'Улаанбаатар',
    'Япон стандарт',
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="mn"
      className={`${notoSans.className} h-full antialiased scroll-smooth`}
      data-scroll-behavior="smooth"
    >
      <body className="flex min-h-full flex-col overflow-x-hidden bg-white text-[#1F2937]">
        {children}
      </body>
    </html>
  )
}
