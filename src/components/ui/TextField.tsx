import type { InputHTMLAttributes, ReactNode, Ref } from 'react'
import { cn } from '@/utils/cn'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode
  ref?: Ref<HTMLInputElement>
}

export function TextField({
  icon,
  className,
  type = 'text',
  ref,
  ...props
}: TextFieldProps) {
  return (
    <div className="relative flex items-stretch">
      {icon && (
        <span className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-slate-400">
          {icon}
        </span>
      )}
      <input
        ref={ref}
        type={type}
        className={cn(
          'w-full rounded-[10px] border border-slate-200 bg-white py-2.5 pr-3.5 text-sm text-slate-900 shadow-sm outline-none transition',
          'placeholder:text-slate-400 hover:border-slate-300',
          'focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10',
          icon ? 'pl-9' : 'pl-3.5',
          className,
        )}
        {...props}
      />
    </div>
  )
}
