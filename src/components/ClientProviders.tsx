'use client'

import { ReactNode, useEffect } from 'react'
import { MantineProvider } from '@mantine/core'
import { ToastProvider } from '@/components/ui/toast'
import { AuthProvider } from '@/contexts/AuthContext'
import { SettingsProvider } from '@/contexts/SettingsContext'
import LayoutWrapper from '@/components/layout/LayoutWrapper'
import { installVendorHeaderInterceptor } from '@/lib/vendor-client'

export default function ClientProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    installVendorHeaderInterceptor()
  }, [])

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

