'use client'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
type Size    = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-[#1E63B5] hover:bg-[#154d8f] text-white border border-transparent',
  secondary: 'bg-[#EAF3FF] hover:bg-[#d3e8ff] text-[#1E63B5] border border-[#c8dff8]',
  danger:    'bg-[#E8323F] hover:bg-[#c0272d] text-white border border-transparent',
  ghost:     'bg-transparent hover:bg-slate-100 text-[#1F2937] border border-transparent',
  outline:   'bg-white hover:bg-[#EAF3FF] text-[#1E63B5] border border-[#1E63B5]',
}

const sizeClasses: Record<Size, string> = {
  sm:  'px-4 py-2 text-sm rounded-lg',
  md:  'px-5 py-2.5 text-sm rounded-xl',
  lg:  'px-6 py-3.5 text-base rounded-xl',
  xl:  'px-8 py-4 text-lg rounded-2xl',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 font-semibold',
        'transition-all duration-150 active:scale-[0.97]',
        'focus:outline-none focus:ring-2 focus:ring-[#1E63B5] focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      )}
      {children}
    </button>
  )
})

Button.displayName = 'Button'
export default Button
