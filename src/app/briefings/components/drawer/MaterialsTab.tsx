"use client"

import { useEffect, useMemo, useState } from 'react'
import { Briefing } from '../../types'
import ContentSection from './ContentSection'
import { Maximize2, Minimize2, ExternalLink } from 'lucide-react'

export default function MaterialsTab({ briefing, onUpdate }: { briefing: Briefing; onUpdate: () => void }) {
  const [url, setUrl] = useState<string>((briefing as any).contentUrl || (briefing as any).contenturl || '')
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    setUrl(((briefing as any).contentUrl || (briefing as any).contenturl || '') as string)
  }, [ (briefing as any).id, (briefing as any).contentUrl, (briefing as any).contenturl ])

  const viewer = useMemo(() => {
    if (!url) return null

    const lower = url.toLowerCase()
    const isAbsolute = /^https?:\/\//i.test(url)
    const absoluteUrl = isAbsolute ? url : (typeof window !== 'undefined' ? `${window.location.origin}${url}` : url)

    if (lower.endsWith('.pdf')) {
      return { src: absoluteUrl, hint: 'PDF' }
    }
    if (lower.endsWith('.ppt') || lower.endsWith('.pptx')) {
      // Use Microsoft Office viewer for PowerPoint
      return { src: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absoluteUrl)}`, hint: 'PowerPoint (via Office viewer)' }
    }
    // Google Slides link -> use preview mode if possible
    if (lower.includes('docs.google.com/presentation')) {
      const preview = absoluteUrl.replace(/\/edit[^/]*$/, '/preview')
      return { src: preview, hint: 'Google Slides' }
    }
    // Fallback: try to embed
    return { src: absoluteUrl, hint: 'Embedded content' }
  }, [url])

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white border rounded-lg">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold text-gray-900">Materials used during the meeting</h3>
          <div className="flex items-center gap-2">
            {url && viewer && (
              <>
                <a href={viewer.src} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm px-2 py-1 border rounded hover:bg-gray-50">
                  <ExternalLink className="w-4 h-4 mr-1" /> Open in new tab
                </a>
                <button
                  className="inline-flex items-center text-sm px-2 py-1 border rounded hover:bg-gray-50"
                  onClick={() => setIsFullscreen(true)}
                >
                  <Maximize2 className="w-4 h-4 mr-1" /> Full screen
                </button>
              </>
            )}
          </div>
        </div>
        <div className="p-4 space-y-4">
          {url && viewer ? (
            <div className="border rounded-lg overflow-hidden">
              <iframe
                title="materials-preview"
                src={viewer.src}
                className="w-full h-[420px] bg-white"
                style={{ border: 'none' }}
              />
            </div>
          ) : (
            <div className="text-sm text-gray-600">No material attached yet. Add a URL or upload a file below.</div>
          )}

          {/* Reuse existing upload/url manager */}
          <ContentSection briefing={briefing} onUpdate={onUpdate} hideHeader />
        </div>
      </div>

      {isFullscreen && viewer && (
        <div className="fixed inset-0 z-50 bg-black/90">
          <div className="absolute top-3 right-3">
            <button
              className="inline-flex items-center text-white bg-black/40 hover:bg-black/60 px-3 py-2 rounded"
              onClick={() => setIsFullscreen(false)}
            >
              <Minimize2 className="w-4 h-4 mr-2" /> Exit full screen
            </button>
          </div>
          <iframe
            title="materials-fullscreen"
            src={viewer.src}
            className="w-full h-full bg-white"
            style={{ border: 'none' }}
          />
        </div>
      )}
    </div>
  )
}
