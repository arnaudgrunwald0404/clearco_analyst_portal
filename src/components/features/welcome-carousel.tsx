'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WelcomeMessage {
  id: string
  title: string
  quote: string
  author: string
  authorTitle: string
  authorImage: string
}

interface WelcomeCarouselProps {
  analystUser: {
    firstName: string
    lastName: string
    company: string
  }
  companySettings?: {
    companyName: string
    industryName?: string
  } | null
}

export default function WelcomeCarousel({ analystUser, companySettings }: WelcomeCarouselProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [currentMessage, setCurrentMessage] = useState(0)

  // Load dismissed state from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('welcomeCarouselDismissed')
    if (dismissed === 'true') {
      setIsDismissed(true)
    }
  }, [])

  // Get the company name from settings or fallback
  const companyName = companySettings?.companyName || analystUser.company || 'ClearCompany'
  
  // Welcome messages array (can be expanded in the future)
  const messages: WelcomeMessage[] = [
    {
      id: '1',
      title: `Welcome ${analystUser.firstName} to your exclusive ${companyName} Analyst Portal`,
      quote: "We're excited to share our journey and insights with the industry's most influential voices. Your perspective helps shape the future of HR technology.",
      author: 'Arnaud Grunwald',
      authorTitle: `Chief Product Officer, ${companyName}`,
      authorImage: 'https://media.licdn.com/dms/image/v2/C4E03AQExN7FOgOVffA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1516217373346?e=1756339200&v=beta&t=duPb2jgDUrrZr1s_ArOPtpfHNDETSM7H31dasVnwNP0'
    },
    // Future messages can be added here
  ]

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem('welcomeCarouselDismissed', 'true')
  }

  const nextMessage = () => {
    setCurrentMessage((prev) => (prev + 1) % messages.length)
  }

  const prevMessage = () => {
    setCurrentMessage((prev) => (prev - 1 + messages.length) % messages.length)
  }

  if (isDismissed || messages.length === 0) {
    return null
  }

  const currentMsg = messages[currentMessage]

  return (
    <div className="bg-white rounded-xl p-8 border border-gray-200 mb-8">
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-700 flex-1 pr-4">
            {currentMsg.title}
          </h1>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Dismiss welcome message"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-4">
          "{currentMsg.quote}"
        </blockquote>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-gray-600">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3 overflow-hidden">
              <img 
                src={currentMsg.authorImage}
                alt={currentMsg.author}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="font-semibold text-gray-700">{currentMsg.author}</div>
              <div className="text-sm text-gray-500">{currentMsg.authorTitle}</div>
            </div>
          </div>

          {/* Carousel controls - only show if there are multiple messages */}
          {messages.length > 1 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={prevMessage}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={messages.length <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {/* Dots indicator */}
              <div className="flex space-x-1">
                {messages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentMessage(index)}
                    className={cn(
                      'w-2 h-2 rounded-full transition-colors',
                      index === currentMessage ? 'bg-gray-600' : 'bg-gray-300'
                    )}
                  />
                ))}
              </div>
              
              <button
                onClick={nextMessage}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={messages.length <= 1}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
