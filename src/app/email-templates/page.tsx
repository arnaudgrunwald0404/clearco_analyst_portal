'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Card, 
  Text, 
  Button, 
  Group, 
  Stack, 
  Modal, 
  TextInput, 
  Textarea,
  ActionIcon,
  Menu,
  Badge,
  Grid,
  Container,
  Title,
  Divider,
  Alert,
  Loader
} from '@mantine/core'
import { 
  Plus, 
  Edit, 
  Trash, 
  Copy, 
  Download, 
  Eye, 
  MoreVertical,
  FileText,
  Calendar,
  Users,
  Mail
} from 'lucide-react'
import EmailTemplateEditor from '@/components/email-template-editor'
import { cn } from '@/lib/utils'

interface EmailTemplate {
  id: string
  name: string
  description?: string
  html: string
  createdAt: string
  updatedAt: string
  isDefault?: boolean
}

export default function EmailTemplatesPage() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateDescription, setNewTemplateDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Default email template
  const defaultTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Template</title>
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; }
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Your Company Name</h1>
        </div>
        <div class="content">
            <h2>Hello {{first_name}},</h2>
            <p>This is your email content. You can customize this template to match your brand and messaging needs.</p>
            <p>Key features of this template:</p>
            <ul>
                <li>Responsive design for mobile and desktop</li>
                <li>Email-safe CSS styling</li>
                <li>Merge tag support ({{first_name}}, {{company}}, etc.)</li>
                <li>Professional layout structure</li>
            </ul>
            <p style="text-align: center; margin: 30px 0;">
                <a href="#" class="button">Call to Action</a>
            </p>
        </div>
        <div class="footer">
            <p>© 2024 Your Company. All rights reserved.</p>
            <p>You received this email because you're subscribed to our newsletter.</p>
            <p><a href="mailto:support@yourcompany.com">Contact Support</a> | <a href="tel:+1234567890">Call Us</a></p>
        </div>
    </div>
</body>
</html>`

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/email-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      } else {
        setError('Failed to load templates')
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      setError('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const createTemplate = async () => {
    if (!newTemplateName.trim()) return

    try {
      const response = await fetch('/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTemplateName,
          description: newTemplateDescription,
          html: defaultTemplate
        })
      })

      if (response.ok) {
        const newTemplate = await response.json()
        setTemplates(prev => [newTemplate, ...prev])
        setCreateModalOpen(false)
        setNewTemplateName('')
        setNewTemplateDescription('')
        setError(null)
      } else {
        setError('Failed to create template')
      }
    } catch (error) {
      console.error('Error creating template:', error)
      setError('Failed to create template')
    }
  }

  const deleteTemplate = async (id: string) => {
    try {
      const response = await fetch(`/api/email-templates/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id))
        if (selectedTemplate?.id === id) {
          setSelectedTemplate(null)
          setEditorOpen(false)
        }
      } else {
        setError('Failed to delete template')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      setError('Failed to delete template')
    }
  }

  const duplicateTemplate = async (template: EmailTemplate) => {
    try {
      const response = await fetch('/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${template.name} (Copy)`,
          description: template.description,
          html: template.html
        })
      })

      if (response.ok) {
        const newTemplate = await response.json()
        setTemplates(prev => [newTemplate, ...prev])
      } else {
        setError('Failed to duplicate template')
      }
    } catch (error) {
      console.error('Error duplicating template:', error)
      setError('Failed to duplicate template')
    }
  }

  const copyToClipboard = async (html: string) => {
    try {
      await navigator.clipboard.writeText(html)
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      setError('Failed to copy to clipboard')
    }
  }

  const downloadTemplate = (template: EmailTemplate) => {
    const blob = new Blob([template.html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const openEditor = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setEditorOpen(true)
  }

  const handleTemplateUpdate = (updatedTemplate: EmailTemplate) => {
    setTemplates(prev => 
      prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t)
    )
    setSelectedTemplate(updatedTemplate)
  }

  if (loading) {
    return (
      <Container size="xl" className="py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
        <p className="mt-2 text-gray-600">
          Create, edit, and manage responsive HTML email templates for your marketing campaigns.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert 
          color="red" 
          title="Error" 
          className="mb-6"
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <Button 
            leftSection={<Plus size={16} />}
            onClick={() => setCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create Template
          </Button>
          <Badge variant="light" color="blue">
            {templates.length} template{templates.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <Title order={3} className="font-atkinson-hyperlegible text-gray-900 mb-2">
            No templates yet
          </Title>
          <Text className="text-gray-600 font-public-sans mb-6">
            Create your first email template to get started with your marketing campaigns.
          </Text>
          <Button 
            leftSection={<Plus size={16} />}
            onClick={() => setCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create Your First Template
          </Button>
        </Card>
      ) : (
        <Grid gutter="md">
          {templates.map((template) => (
            <Grid.Col key={template.id} span={{ base: 12, sm: 6, lg: 4 }}>
              <Card 
                shadow="sm" 
                padding="lg" 
                radius="md" 
                withBorder
                className="h-full hover:shadow-md transition-shadow"
              >
                <Card.Section className="p-4">
                  <Group justify="space-between" align="flex-start">
                    <div className="flex-1 min-w-0">
                      <Title 
                        order={4} 
                        className="font-atkinson-hyperlegible text-gray-900 mb-1 truncate"
                      >
                        {template.name}
                      </Title>
                      {template.description && (
                        <Text 
                          size="sm" 
                          className="text-gray-600 font-public-sans mb-2 line-clamp-2"
                        >
                          {template.description}
                        </Text>
                      )}
                      <Text size="xs" className="text-gray-500 font-public-sans">
                        Updated {new Date(template.updatedAt).toLocaleDateString()}
                      </Text>
                    </div>
                    <Menu>
                      <Menu.Target>
                        <ActionIcon variant="subtle" size="sm">
                          <MoreVertical size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item 
                          leftSection={<Edit size={14} />}
                          onClick={() => openEditor(template)}
                        >
                          Edit
                        </Menu.Item>
                        <Menu.Item 
                          leftSection={<Copy size={14} />}
                          onClick={() => duplicateTemplate(template)}
                        >
                          Duplicate
                        </Menu.Item>
                        <Menu.Item 
                          leftSection={<Download size={14} />}
                          onClick={() => downloadTemplate(template)}
                        >
                          Download
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item 
                          leftSection={<Trash size={14} />}
                          color="red"
                          onClick={() => deleteTemplate(template.id)}
                        >
                          Delete
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                </Card.Section>

                <Card.Section className="px-4 pb-4">
                  <Group gap="xs">
                    <Button 
                      variant="light" 
                      size="sm"
                      leftSection={<Edit size={14} />}
                      onClick={() => openEditor(template)}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="subtle" 
                      size="sm"
                      leftSection={<Copy size={14} />}
                      onClick={() => copyToClipboard(template.html)}
                    >
                      Copy
                    </Button>
                  </Group>
                </Card.Section>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      )}

      {/* Create Template Modal */}
      <Modal 
        opened={createModalOpen} 
        onClose={() => setCreateModalOpen(false)}
        title="Create New Template"
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="Template Name"
            placeholder="Enter template name"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            required
          />
          <Textarea
            label="Description (Optional)"
            placeholder="Brief description of this template"
            value={newTemplateDescription}
            onChange={(e) => setNewTemplateDescription(e.target.value)}
            rows={3}
          />
          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={createTemplate}
              disabled={!newTemplateName.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Template
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Email Template Editor Modal */}
      {selectedTemplate && (
        <EmailTemplateEditor
          template={selectedTemplate}
          open={editorOpen}
          onClose={() => {
            setEditorOpen(false)
            setSelectedTemplate(null)
          }}
          onUpdate={handleTemplateUpdate}
        />
      )}
    </div>
  )
} 