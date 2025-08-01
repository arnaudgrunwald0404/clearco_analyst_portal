import { useState } from 'react'

interface HelpText {
  title: string
  content: string
}

export function useHelpText() {
  const [currentHelp, setCurrentHelp] = useState<HelpText | null>(null)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)

  const showHelp = (helpText: HelpText, element?: HTMLElement) => {
    setCurrentHelp(helpText)
    setTargetElement(element || null)
  }

  const hideHelp = () => {
    setCurrentHelp(null)
    setTargetElement(null)
  }

  return {
    currentHelp,
    targetElement,
    showHelp,
    hideHelp
  }
} 