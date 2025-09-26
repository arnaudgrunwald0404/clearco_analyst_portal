import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Industry Relationship Management",
  description: "Industry relationship management portal",
  icons: {
    // Use a larger 2x icon to make the favicon appear bigger
    icon: [
      { url: "/cupcake_alone-removebg-preview@2x.png", sizes: "1200x1200" },
    ],
  },
};

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
