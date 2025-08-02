import { NextRequest, NextResponse } from 'next/server'
import { GeminiService } from '@/lib/services/gemini.service'

export async function POST(request: NextRequest) {
  try {
    const { topic, keywords, fieldOfStudy } = await request.json()

    if (!topic && !keywords) {
      return NextResponse.json(
        { error: 'Tópico ou palavras-chave são obrigatórios' },
        { status: 400 }
      )
    }

    const suggestions = await GeminiService.suggestLiterature(
      topic || '',
      keywords || '',
      fieldOfStudy || ''
    )

    return NextResponse.json({
      success: true,
      suggestions
    })

  } catch (error) {
    console.error('Erro na sugestão de literatura:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
