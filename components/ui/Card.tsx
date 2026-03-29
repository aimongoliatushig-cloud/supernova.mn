import { type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'sm' | 'md' | 'none'
}

export default function Card({
  padding = 'md',
  shadow = 'sm',
  className = '',
  children,
  ...props
}: CardProps) {
  const padMap = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' }
  const shadMap = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
  }
  return (
    <div
      className={[
        'bg-white rounded-2xl border border-[#E5E7EB]',
        padMap[padding],
        shadMap[shadow],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}
