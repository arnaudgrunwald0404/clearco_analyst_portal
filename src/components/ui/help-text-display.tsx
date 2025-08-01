import React from 'react'

interface HelpText {
  title: string
  content: string
}

interface HelpTextDisplayProps {
  helpText: HelpText | null
}

export function HelpTextDisplay({ helpText }: HelpTextDisplayProps) {
  if (!helpText) {
    return null
  }

  return (
    <div className="bg-transparent border-none p-0">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{helpText.title}</h3>
      <div className="text-sm text-gray-700">
        <p>{helpText.content}</p>
      </div>
    </div>
  )
} 