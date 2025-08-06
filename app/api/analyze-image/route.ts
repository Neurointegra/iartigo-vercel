import { NextRequest, NextResponse } from 'next/server'
import { GeminiService } from '@/lib/services/gemini.service'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imagePath, context } = body

    console.log('🔍 Iniciando análise de imagem:', imagePath)

    if (!imagePath) {
      return NextResponse.json(
        { error: 'Caminho da imagem é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o arquivo existe
    const fullPath = path.join(process.cwd(), 'public', 'uploads', imagePath)
    
    console.log('📁 Verificando arquivo em:', fullPath)
    
    if (!fs.existsSync(fullPath)) {
      console.error('❌ Arquivo não encontrado:', fullPath)
      return NextResponse.json(
        { error: 'Imagem não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se é realmente um arquivo de imagem
    const ext = path.extname(imagePath).toLowerCase()
    const validExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
    
    if (!validExts.includes(ext)) {
      console.error('❌ Formato de arquivo não suportado:', ext)
      return NextResponse.json(
        { error: 'Formato de arquivo não suportado' },
        { status: 400 }
      )
    }

    console.log('✅ Arquivo válido encontrado, tipo:', ext)

    // Ler o arquivo de imagem
    const imageBuffer = fs.readFileSync(fullPath)
    const imageData = imageBuffer.toString('base64')

    console.log('📸 Imagem convertida para base64, tamanho:', imageData.length)

    // Analisar a imagem com Gemini Vision
    const description = await GeminiService.analyzeImage(imageData, context)

    console.log('✅ Análise concluída:', description)

    return NextResponse.json({
      success: true,
      description,
      imagePath
    })

  } catch (error) {
    console.error('❌ Erro ao analisar imagem:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
