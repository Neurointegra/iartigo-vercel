import { NextRequest, NextResponse } from 'next/server'
import { GeminiService } from '@/lib/services/gemini.service'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imagePath, context } = body

    if (!imagePath) {
      return NextResponse.json(
        { error: 'Caminho da imagem é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o arquivo existe
    const fullPath = path.join(process.cwd(), 'public', 'uploads', imagePath)
    
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { error: 'Imagem não encontrada' },
        { status: 404 }
      )
    }

    // Ler o arquivo de imagem
    const imageBuffer = fs.readFileSync(fullPath)
    const imageData = imageBuffer.toString('base64')

    // Analisar a imagem com Gemini Vision
    const description = await GeminiService.analyzeImage(imageData, context)

    return NextResponse.json({
      success: true,
      description,
      imagePath
    })

  } catch (error) {
    console.error('Erro ao analisar imagem:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
