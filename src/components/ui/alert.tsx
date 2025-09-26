'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'secondary'
}

export function Alert({ className, variant = 'default', ...props }: AlertProps) {
  const variants: Record<string, string> = {
    default: 'bg-gray-50 border-gray-200 text-gray-800',
    destructive: 'bg-red-50 border-red-200 text-red-800',
    secondary: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  }
  return (
    <div
      role="alert"
      className={cn('w-full rounded-lg border p-4 text-sm', variants[variant], className)}
      {...props}
    />
  )
}

export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5 className={cn('mb-1 font-semibold leading-none tracking-tight', className)} {...props} />
  )
}

export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
  )
}

