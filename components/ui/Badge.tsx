type Color = 'blue' | 'red' | 'green' | 'yellow' | 'gray'

interface BadgeProps {
  children: React.ReactNode
  color?: Color
  className?: string
}

const colorMap: Record<Color, string> = {
  blue:   'bg-[#EAF3FF] text-[#1E63B5] border-[#c8dff8]',
  red:    'bg-[#FEE9EB] text-[#E8323F] border-[#fcd0d2]',
  green:  'bg-[#DCFCE7] text-[#16A34A] border-[#bbf7d0]',
  yellow: 'bg-[#FEF9C3] text-[#D97706] border-[#fef08a]',
  gray:   'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]',
}

export default function Badge({ children, color = 'blue', className = '' }: BadgeProps) {
  return (
    <span className={[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
      colorMap[color],
      className,
    ].join(' ')}>
      {children}
    </span>
  )
}
