"use client"

import React from 'react'
import { cn } from '@/lib/utils'

export type DotWaveSize = 'sm' | 'md' | 'lg' | 'xl'

const sizeMap: Record<DotWaveSize, number> = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
}

export function DotWave({ size = 'md', className }: { size?: DotWaveSize; className?: string }) {
  const dot = sizeMap[size]

  return (
    <div className={cn('inline-flex items-end gap-[4px]', className)} role="status" aria-label="Loading">
      <span className="dot" style={{ width: dot, height: dot }} />
      <span className="dot" style={{ width: dot, height: dot, animationDelay: '0.12s' }} />
      <span className="dot" style={{ width: dot, height: dot, animationDelay: '0.24s' }} />

      <style jsx>{`
        .dot {
          display: inline-block;
          background-color: currentColor;
          border-radius: 9999px;
          transform: translateY(0);
          animation: dot-wave 0.9s ease-in-out infinite;
          opacity: 0.85;
        }
        @keyframes dot-wave {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.85; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}