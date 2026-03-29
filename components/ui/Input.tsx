import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label, error, hint, className = '', id, ...props
}, ref) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[#1F2937]">
          {label}
          {props.required && <span className="text-[#E8323F] ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={[
          'w-full px-4 py-3 rounded-xl border text-[#1F2937] text-sm',
          'placeholder:text-[#9CA3AF] bg-white',
          'focus:outline-none focus:ring-2 focus:ring-[#1E63B5] focus:border-transparent',
          'transition-colors',
          error
            ? 'border-[#E8323F] bg-[#FEE9EB]'
            : 'border-[#E5E7EB] hover:border-[#1E63B5]/40',
          className,
        ].join(' ')}
        {...props}
      />
      {hint && !error && <p className="text-xs text-[#6B7280]">{hint}</p>}
      {error && <p className="text-xs text-[#E8323F]">{error}</p>}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
