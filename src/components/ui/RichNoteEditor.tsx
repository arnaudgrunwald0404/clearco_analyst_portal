'use client'

import React, { useEffect } from 'react'
import { Tooltip } from '@mantine/core'
import { RichTextEditor as MantineRTE } from '@mantine/tiptap'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'

interface RichNoteEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  minHeight?: number
  maxHeight?: number
}

export default function RichNoteEditor({ value, onChange, placeholder = 'Write a note...', className }: RichNoteEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({}),
      Underline,
      Link.configure({ openOnClick: true, autolink: true, protocols: ['http', 'https', 'mailto'] }),
    ],
    content: value || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
      },
    },
  })

  // Keep editor in sync if value prop changes externally
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (value !== current) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [value, editor])

  return (
    <div className={(className ? className + ' ' : '') + 'rte-notes'}>
      <MantineRTE editor={editor}>
        <MantineRTE.Toolbar sticky stickyOffset={0}>
          <MantineRTE.ControlsGroup>
            <Tooltip label="Bold (⌘B)"><div><MantineRTE.Bold /></div></Tooltip>
            <Tooltip label="Italic (⌘I)"><div><MantineRTE.Italic /></div></Tooltip>
            <Tooltip label="Underline (⌘U)"><div><MantineRTE.Underline /></div></Tooltip>
          </MantineRTE.ControlsGroup>
          <MantineRTE.ControlsGroup>
            <Tooltip label="Bullet list (⌘⇧8)"><div><MantineRTE.BulletList /></div></Tooltip>
            <Tooltip label="Ordered list (⌘⇧7)"><div><MantineRTE.OrderedList /></div></Tooltip>
          </MantineRTE.ControlsGroup>
          <MantineRTE.ControlsGroup>
            <Tooltip label="Insert link (⌘K)"><div><MantineRTE.Link /></div></Tooltip>
            <Tooltip label="Remove link"><div><MantineRTE.Unlink /></div></Tooltip>
          </MantineRTE.ControlsGroup>
        </MantineRTE.Toolbar>
        <MantineRTE.Content>
          <EditorContent editor={editor} />
          {!value && (
            <div className="pointer-events-none text-gray-600 text-sm mt-2 p-4 ">{placeholder}</div>
          )}
        </MantineRTE.Content>
      </MantineRTE>
    </div>
  )
}
