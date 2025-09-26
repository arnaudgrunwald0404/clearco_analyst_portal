"use client"

import { useEffect } from "react"
import { X } from "lucide-react"

interface VendorSwitcherDrawerProps {
  open: boolean
  onClose: () => void
  vendors: string[]
  selected?: string | null
  onSelect: (name: string) => void
}

export default function VendorSwitcherDrawer({ open, onClose, vendors, selected, onSelect }: VendorSwitcherDrawerProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Drawer panel */}
      <aside
        className="absolute left-0 top-0 h-full w-[340px] max-w-[85vw] bg-white shadow-xl border-r border-gray-200 flex flex-col"
        role="dialog"
        aria-label="Choose Vendor"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-base font-semibold text-gray-900">Choose Vendor</h3>
          <button aria-label="Close" onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {vendors.length === 0 && (
            <div className="text-sm text-gray-500">No vendors available.</div>
          )}
          <ul className="space-y-2">
            {vendors.map((name) => (
              <li key={name}>
                <button
                  onClick={() => onSelect(name)}
                  className={`w-full text-left px-3 py-2 rounded border transition-colors ${
                    selected === name ? 'border-blue-400 bg-blue-50 text-blue-800' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium truncate">{name}</div>
                  {selected === name && <div className="text-xs text-blue-700">Selected</div>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}