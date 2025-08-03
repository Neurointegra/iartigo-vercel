import { NextRequest, NextResponse } from 'next/server'
import { GeminiService } from '@/lib/services/gemini.service'
import { processImageTags } from '@/lib/utils/image-processor'

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

    // Criar um prompt específico para edição com instruções melhoradas
    const editPrompt = `
Como editor científico especializado em edição de artigos acadêmicos, edite o seguinte conteúdo conforme a instrução:

**Instrução de edição:** ${editInstruction}

**Título do artigo:** ${title || 'Não especificado'}
**Área de estudo:** ${fieldOfStudy || 'Geral'}
**Palavras-chave:** ${keywords || 'Não especificadas'}

**Conteúdo atual para edição:**
${currentContent}

**INSTRUÇÕES CRÍTICAS DE FORMATAÇÃO:**
1. APLIQUE APENAS a edição solicitada mantendo toda a estrutura existente
2. PRESERVE EXATAMENTE todas as tags [Imagem: arquivo.extensao] nas mesmas posições
3. PRESERVE EXATAMENTE todas as tags [CHART:id] nas mesmas posições  
4. PRESERVE EXATAMENTE todos os placeholders __IMAGE_PLACEHOLDER_ e __CHART_PLACEHOLDER_
5. Mantenha toda a formatação HTML e CSS inline existente
6. Use linguagem científica formal e objetiva
7. NUNCA use blocos de código markdown (\`\`\`) no início ou fim da resposta
8. NUNCA envolva o conteúdo em \`\`\`html ou \`\`\`
9. Retorne APENAS o conteúdo HTML editado diretamente
10. NÃO adicione explicações, observações ou comentários após o conteúdo
11. Use marcações **negrito**, *itálico* e _sublinhado_ apenas quando apropriado científicamente

**REFERENCIAS VISUAIS - ATENÇÃO ESPECIAL:**
- Se encontrar tags como [Imagem: nome.jpg], mantenha-as EXATAMENTE como estão
- Se encontrar tags como [CHART:id_grafico], mantenha-as EXATAMENTE como estão
- Se encontrar placeholders como __IMAGE_PLACEHOLDER_0__, mantenha-os EXATAMENTE como estão
- Se encontrar placeholders como __CHART_PLACEHOLDER_0__, mantenha-os EXATAMENTE como estão
- Estas referências são ESSENCIAIS e NÃO devem ser removidas ou alteradas

**FORMATO DE SAÍDA OBRIGATÓRIO:**
- Comece diretamente com o conteúdo HTML editado
- Termine diretamente com o conteúdo HTML editado
- SEM prefixos, sufixos ou observações
- SEM blocos de código markdown

Edite o conteúdo conforme solicitado:
`

    // Usar GeminiService que já tem limpeza de markdown implementada
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const result = await model.generateContent(editPrompt)
    const response = await result.response
    let editedContent = response.text()

    // Aplicar limpeza de blocos de código markdown (mesmo método do GeminiService)
    editedContent = cleanMarkdownCodeBlocks(editedContent)

    // Processar tags de imagem para buscar arquivos na pasta uploads
    editedContent = await processImageTags(editedContent)

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

// Função para limpar blocos de código markdown (copiada do GeminiService)
function cleanMarkdownCodeBlocks(text: string): string {
  let cleanText = text.trim()
  
  // Remove ```html ou ``` no início
  if (cleanText.startsWith('```html')) {
    cleanText = cleanText.substring(7).trim()
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.substring(3).trim()
  }
  
  // Remove ``` no final
  if (cleanText.endsWith('```')) {
    cleanText = cleanText.substring(0, cleanText.length - 3).trim()
  }
  
  // Remove observações após o HTML
  const lines = cleanText.split('\n')
  let htmlEndIndex = lines.length
  
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim()
    if (line.startsWith('**Observações:**') || 
        line.startsWith('**') || 
        line.includes('esqueleto') ||
        line.includes('Lembre-se') ||
        line.includes('placeholder')) {
      htmlEndIndex = i
      break
    }
    if (line === '</html>') {
      htmlEndIndex = i + 1
      break
    }
  }
  
  // Processar linhas para remover espaçamentos excessivos
  const processedLines = lines.slice(0, htmlEndIndex)
  
  // Remover linhas vazias excessivas no início
  let startIndex = 0
  while (startIndex < processedLines.length && processedLines[startIndex].trim() === '') {
    startIndex++
  }
  
  // Reduzir múltiplas linhas vazias consecutivas para no máximo 1
  const finalLines = []
  let emptyLineCount = 0
  
  for (let i = startIndex; i < processedLines.length; i++) {
    const line = processedLines[i]
    
    if (line.trim() === '') {
      emptyLineCount++
      if (emptyLineCount <= 1) {
        finalLines.push(line)
      }
    } else {
      emptyLineCount = 0
      finalLines.push(line)
    }
  }
  
  return finalLines.join('\n').trim()
}
