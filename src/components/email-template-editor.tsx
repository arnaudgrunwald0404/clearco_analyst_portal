'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Modal, 
  Group, 
  Button, 
  Text, 
  SegmentedControl, 
  ActionIcon, 
  Tooltip,
  Alert
} from '@mantine/core'
import { 
  Smartphone, 
  Monitor, 
  Copy, 
  Download, 
  Save, 
  Check,
  AlertTriangle
} from 'lucide-react'
import Editor from '@monaco-editor/react'

interface EmailTemplate {
  id: string
  name: string
  description?: string
  html: string
  createdAt: string
  updatedAt: string
  isDefault?: boolean
}

interface EmailTemplateEditorProps {
  template: EmailTemplate
  open: boolean
  onClose: () => void
  onUpdate: (template: EmailTemplate) => void
}

export default function EmailTemplateEditor({
  template,
  open,
  onClose,
  onUpdate
}: EmailTemplateEditorProps) {
  const [html, setHtml] = useState(template.html)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    setHtml(template.html)
    setError(null)
    setSuccess(false)
  }, [template])

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current
      const doc = iframe.contentDocument || iframe.contentWindow?.document
      
      if (doc) {
        doc.open()
        doc.write(html)
        doc.close()
      }
    }
  }, [html])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/email-templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          html: html
        })
      })

      if (response.ok) {
        const updatedTemplate = await response.json()
        onUpdate(updatedTemplate)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 2000)
      } else {
        setError('Failed to save template')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      setError('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(html)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      setError('Failed to copy to clipboard')
    }
  }

  const downloadTemplate = () => {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Modal
      opened={open}
      onClose={onClose}
      size="95vw"
      title={
        <div className="flex items-center justify-between w-full">
          <Text className="font-atkinson-hyperlegible text-lg font-semibold">
            Edit Template: {template.name}
          </Text>
          <Group gap="xs">
            <SegmentedControl
              size="xs"
              value={previewMode}
              onChange={(value) => setPreviewMode(value as 'desktop' | 'mobile')}
              data={[
                { label: <Monitor size={14} />, value: 'desktop' },
                { label: <Smartphone size={14} />, value: 'mobile' }
              ]}
            />
          </Group>
        </div>
      }
    >
      <div className="flex h-[80vh]">
        {/* Editor Panel */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Text size="sm" className="font-public-sans text-gray-600">
              HTML Editor
            </Text>
            <Group gap="xs">
              {success && (
                <div className="flex items-center gap-1 text-green-600">
                  <Check size={14} />
                  <Text size="xs">Saved</Text>
                </div>
              )}
              <Button
                size="xs"
                leftSection={<Save size={14} />}
                onClick={handleSave}
                loading={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Save
              </Button>
              <Tooltip label="Copy HTML">
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  onClick={copyToClipboard}
                >
                  <Copy size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Download">
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  onClick={downloadTemplate}
                >
                  <Download size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </div>
          
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="html"
              value={html}
              onChange={(value) => setHtml(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: 'on',
                theme: 'vs-dark'
              }}
            />
          </div>
        </div>

        {/* Preview Panel */}
        <div className="flex-1 flex flex-col border-l border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Text size="sm" className="font-public-sans text-gray-600">
              Live Preview
            </Text>
            <Text size="xs" className="text-gray-500">
              {previewMode === 'mobile' ? 'Mobile View' : 'Desktop View'}
            </Text>
          </div>

          <div className="flex-1 p-4 bg-gray-50">
            <div className={`mx-auto bg-white shadow-lg ${
              previewMode === 'mobile' ? 'max-w-sm' : 'max-w-2xl'
            }`}>
              <iframe
                ref={iframeRef}
                title="Email Preview"
                className="w-full h-[calc(80vh-120px)] border-0"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 border-t border-gray-200">
          <Alert
            color="red"
            title="Error"
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        </div>
      )}

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200">
        <Group justify="space-between">
          <Text size="xs" className="text-gray-500 font-public-sans">
            Use merge tags like {{first_name}}, {{company}} for personalization
          </Text>
          <Group gap="sm">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Changes
            </Button>
          </Group>
        </Group>
      </div>
    </Modal>
  )
} 