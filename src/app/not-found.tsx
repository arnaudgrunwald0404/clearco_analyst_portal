'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto h-24 w-24 text-gray-400">
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 0a6 6 0 016 6h-6m0-6V4a6 6 0 016 6m-6 0h6"
              />
            </svg>
          </div>
          <h1 className="mt-6 text-6xl font-extrabold text-gray-900">
            404
          </h1>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            Page not found
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>
        
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="default">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go home
            </Link>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go back
          </Button>
        </div>
      </div>
    </div>
  )
}
