'use client'

import React, { useEffect } from 'react'
import DOMPurify from 'dompurify'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'

interface RichNoteViewerProps {
  value: string
  className?: string
}

export default function RichNoteViewer({ value, className }: RichNoteViewerProps) {
  const sanitized = DOMPurify.sanitize(value || '')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({}),
      Underline,
      Link.configure({ openOnClick: true, autolink: true, protocols: ['http', 'https', 'mailto'] }),
    ],
    content: sanitized,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none',
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const next = DOMPurify.sanitize(value || '')
    const current = editor.getHTML()
    if (next !== current) editor.commands.setContent(next || '', { emitUpdate: false })
  }, [value, editor])

  return (
    <div className={className}>
      <EditorContent editor={editor} />
    </div>
  )
}
