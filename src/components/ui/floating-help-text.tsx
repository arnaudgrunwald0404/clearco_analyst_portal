import React, { useState, useEffect, useRef } from 'react'

interface HelpText {
  title: string
  content: string
}

interface FloatingHelpTextProps {
  helpText: HelpText | null
  targetElement?: HTMLElement | null
}

export function FloatingHelpText({ helpText, targetElement }: FloatingHelpTextProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const helpRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!helpText || !targetElement || !helpRef.current) {
      return
    }

    const updatePosition = () => {
      const rect = targetElement.getBoundingClientRect()
      const helpRect = helpRef.current?.getBoundingClientRect()
      
      // Position help text to the right of the input field
      const newPosition = {
        top: rect.top + window.scrollY + 12,
        left: rect.right + window.scrollX + 30 // 16px gap
      }
      
      setPosition(newPosition)
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition)
      window.removeEventListener('resize', updatePosition)
    }
  }, [helpText, targetElement])

  if (!helpText) {
    return null
  }

  return (
    <div
      ref={helpRef}
      className="fixed ml-12 p-4 max-w-xs"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`
      }}
    >
    
      <div className="text-sm text-grey-400">
        <p>{helpText.content}</p>
      </div>
    </div>
  )
} 