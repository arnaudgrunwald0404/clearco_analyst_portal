'use client'

import { ReactNode } from 'react'
import { MantineProvider } from '@mantine/core'
import { ToastProvider } from '@/components/ui/toast'
import { AuthProvider } from '@/contexts/AuthContext'
import { SettingsProvider } from '@/contexts/SettingsContext'
import LayoutWrapper from '@/components/layout/LayoutWrapper'

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <MantineProvider withCssVariables>
      <ToastProvider>
        <AuthProvider>
          <SettingsProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </SettingsProvider>
        </AuthProvider>
      </ToastProvider>
    </MantineProvider>
  )
}

