'use client'

import { cn } from '@/lib/utils'

interface SpinningCupcakeProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function SpinningCupcake({ className, size = 'md' }: SpinningCupcakeProps) {
  const sizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12', 
    lg: 'w-18 h-18',
    xl: 'w-24 h-24'
  }

  return (
    <img
      src="/cupcake_alone-removebg-preview.png"
      alt="Loading..."
      className={cn(
        'object-contain animate-spin-slow-to-medium',
        sizeClasses[size],
        className
      )}
    />
  )
}
