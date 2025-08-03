import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AUW Sound Studio Demo',
  description: 'Scroll and mouse-controlled video playback',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}