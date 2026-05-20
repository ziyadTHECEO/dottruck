import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const inputBase =
  'w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200 bg-white min-h-[48px]'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}
export function Input({ label, id, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-600">
          {label}
        </label>
      )}
      <input id={id} {...props} className={`${inputBase} ${className}`} />
    </div>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  children: React.ReactNode
}
export function Select({ label, id, className = '', children, ...props }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-600">
          {label}
        </label>
      )}
      <select
        id={id}
        {...props}
        className={`${inputBase} cursor-pointer ${className}`}
      >
        {children}
      </select>
    </div>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}
export function Textarea({ label, id, className = '', ...props }: TextareaProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-600">
          {label}
        </label>
      )}
      <textarea
        id={id}
        {...props}
        className={`w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200 bg-white resize-none ${className}`}
      />
    </div>
  )
}
