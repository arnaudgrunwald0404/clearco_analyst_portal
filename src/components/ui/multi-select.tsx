'use client'

import React, { useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Option {
  value: string
  label: string
  alias?: string
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({ 
  options, 
  selected, 
  onChange, 
  placeholder = "Select options...",
  className 
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value]
    onChange(newSelected)
  }

  const handleClear = () => {
    onChange([])
  }

  const selectedOptions = options.filter(option => selected.includes(option.value))

  return (
    <div className={cn("relative", className)}>
      {/* Trigger */}
      <div 
        className="flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {selected.length === 0 ? (
            <span className="text-gray-500">{placeholder}</span>
          ) : (
            <div className="flex items-center gap-1 flex-wrap">
              {selectedOptions.slice(0, 2).map(option => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {option.alias || option.label}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-blue-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggle(option.value)
                    }}
                  />
                </span>
              ))}
              {selected.length > 2 && (
                <span className="text-xs text-gray-500">
                  +{selected.length - 2} more
                </span>
              )}
            </div>
          )}
        </div>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {selected.length > 0 && (
            <div className="px-3 py-2 border-b border-gray-200">
              <button
                onClick={handleClear}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Clear all
              </button>
            </div>
          )}
          {options.map(option => {
            const isSelected = selected.includes(option.value)
            return (
              <div
                key={option.value}
                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50"
                onClick={() => handleToggle(option.value)}
              >
                <span className="text-sm">{option.label}</span>
                {isSelected && <Check className="w-4 h-4 text-blue-600" />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}



