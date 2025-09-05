import './globals.css'
import type { Metadata } from 'next'
import localFont from "next/font/local";

// Satoshi Local Font
const Satoshi = localFont({
  src: '../fonts/Fonts/TTF/Satoshi-Variable.ttf',
  display: 'swap',
});

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
      <body className={Satoshi.className}>{children}</body>
    </html>
  )
}