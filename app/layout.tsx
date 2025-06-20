import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "iArtigo - Gerador Inteligente de Artigos Científicos",
  description:
    "Transforme suas ideias em artigos científicos profissionais com IA. Formatação automática, referências inteligentes e gráficos de qualidade acadêmica.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
