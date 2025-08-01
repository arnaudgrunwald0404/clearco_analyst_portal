"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Quote } from "lucide-react"

interface AnalystTestimonial {
  id: string
  quote: string
  context?: string
  analyst: {
    id: string
    firstName: string
    lastName: string
    company: string
    title: string
    profileImageUrl?: string
  }
}

interface AnalystTestimonialsProps {
  testimonials: AnalystTestimonial[]
  className?: string
  title?: string
  description?: string
  maxDisplayed?: number
}

export function AnalystTestimonials({
  testimonials,
  className,
  title = "What Industry Analysts Are Saying",
  description = "Trusted feedback from leading industry analysts and research firms.",
  maxDisplayed = 6,
}: AnalystTestimonialsProps) {
  const [showAll, setShowAll] = useState(false)

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getAvatarUrl = (analyst: AnalystTestimonial['analyst']) => {
    if (analyst.profileImageUrl) {
      return analyst.profileImageUrl
    }
    // Generate a consistent color based on the analyst's name
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
    ]
    const hash = analyst.firstName.charCodeAt(0) + analyst.lastName.charCodeAt(0)
    return colors[hash % colors.length]
  }

  return (
    <div className={className}>
      <div className="flex flex-col items-center justify-center pt-5">
        <div className="flex flex-col gap-5 mb-8">
          <h2 className="text-center text-4xl font-medium">{title}</h2>
          <p className="text-center text-muted-foreground max-w-2xl">
            {description}
          </p>
        </div>
      </div>

      <div className="relative">
        <div
          className={cn(
            "flex justify-center items-start gap-6 flex-wrap",
            !showAll &&
              testimonials.length > maxDisplayed &&
              "max-h-[800px] overflow-hidden",
          )}
        >
          {testimonials
            .slice(0, showAll ? undefined : maxDisplayed)
            .map((testimonial) => (
              <Card
                key={testimonial.id}
                className="w-96 h-auto p-6 relative bg-card border-border hover:shadow-lg transition-shadow"
              >
                {/* Quote Icon */}
                <div className="absolute top-4 right-4">
                  <Quote className="h-6 w-6 text-muted-foreground/30" />
                </div>

                {/* Testimonial Text */}
                <div className="mb-6">
                  <p className="text-foreground font-medium text-lg leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                  {testimonial.context && (
                    <p className="text-sm text-muted-foreground mt-3 italic">
                      — {testimonial.context}
                    </p>
                  )}
                </div>

                {/* Analyst Info */}
                <div className="flex items-center">
                  {testimonial.analyst.profileImageUrl ? (
                    <Image
                      src={testimonial.analyst.profileImageUrl}
                      alt={`${testimonial.analyst.firstName} ${testimonial.analyst.lastName}`}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold",
                      getAvatarUrl(testimonial.analyst)
                    )}>
                      {getInitials(testimonial.analyst.firstName, testimonial.analyst.lastName)}
                    </div>
                  )}
                  <div className="flex flex-col ml-4">
                    <span className="font-semibold text-base">
                      {testimonial.analyst.firstName} {testimonial.analyst.lastName}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {testimonial.analyst.title}
                    </span>
                    <span className="text-sm font-medium text-primary">
                      {testimonial.analyst.company}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
        </div>

        {testimonials.length > maxDisplayed && !showAll && (
          <>
            <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-background to-transparent" />
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20">
              <Button variant="secondary" onClick={() => setShowAll(true)}>
                Load More Testimonials
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
