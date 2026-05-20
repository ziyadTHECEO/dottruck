import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'text'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'bg-accent hover:bg-accent-hover text-white font-semibold transition-all duration-200',
  secondary:
    'bg-white border border-border text-nardo hover:bg-surface font-medium transition-all duration-200',
  danger:
    'bg-white border border-error text-error hover:bg-red-50 font-medium transition-all duration-200',
  text:
    'bg-transparent text-accent hover:underline font-medium transition-all duration-200',
}

export function Button({
  variant = 'primary',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={[
        'min-h-[48px] px-4 rounded-xl text-base',
        fullWidth ? 'w-full' : '',
        variants[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  )
}
