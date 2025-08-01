import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { ToastProvider } from "@/components/ui/toast";
import { MantineProvider } from '@mantine/core';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Analyst ManagementPortal",
  description: "Industry analyst relationship management portal for HR tech companies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      </head>
      <body className={inter.className}>
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
      </body>
    </html>
  );
}
