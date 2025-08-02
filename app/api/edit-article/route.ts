import { NextRequest, NextResponse } from 'next/server'
import { GeminiService } from '@/lib/services/gemini.service'

export async function POST(request: NextRequest) {
  try {
    const { 
      currentContent, 
      editInstruction, 
      title, 
      abstract, 
      keywords,
      fieldOfStudy 
    } = await request.json()

    if (!currentContent || !editInstruction) {
      return NextResponse.json(
        { error: 'Conteúdo atual e instrução são obrigatórios' },
        { status: 400 }
      )
    }

    // Criar um prompt específico para edição
    const editPrompt = `
Como editor científico especializado, edite o seguinte conteúdo conforme a instrução:

**Instrução de edição:** ${editInstruction}

**Título do artigo:** ${title || 'Não especificado'}
**Área de estudo:** ${fieldOfStudy || 'Geral'}
**Palavras-chave:** ${keywords || 'Não especificadas'}

**Conteúdo atual:**
${currentContent}

**Instruções:**
1. Aplique APENAS a edição solicitada
2. Mantenha a estrutura científica existente
3. Preserve citações e formatação
4. Use marcações **negrito**, *itálico* e _sublinhado_ quando apropriado
5. Retorne APENAS o conteúdo editado, sem explicações adicionais

**Conteúdo editado:**
`

    // Usar modelo Gemini diretamente para edição
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const result = await model.generateContent(editPrompt)
    const response = await result.response
    const editedContent = response.text()

    return NextResponse.json({
      success: true,
      content: editedContent
    })

  } catch (error) {
    console.error('Erro na edição assistida por IA:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
