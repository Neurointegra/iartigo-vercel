import { NextRequest, NextResponse } from 'next/server'
import { GeminiService } from '@/lib/services/gemini.service'
import { ArticleService } from '@/lib/services/article.service'
import { processImageTags } from '@/lib/utils/image-processor'

// Função para processar gráficos automaticamente no conteúdo baseado em dados fornecidos
async function processChartsInContent(content: string, dataFiles?: any[]): Promise<string> {
  try {
    // Encontrar todas as tags [CHART:id] no conteúdo
    const chartTags = content.match(/\[CHART:([^\]]+)\]/g)
    
    if (!chartTags || chartTags.length === 0) {
      console.log('📊 Nenhuma tag [CHART:] encontrada no conteúdo')
      return content
    }

    // NOVO SISTEMA: Dados obrigatórios para gráficos
    if (!dataFiles || !Array.isArray(dataFiles) || dataFiles.length === 0) {
      console.error('❌ ERRO: Tags [CHART:] encontradas mas nenhum arquivo de dados fornecido')
      
      // Substituir tags por mensagem de erro
      let processedContent = content
      chartTags.forEach(tag => {
        const errorMessage = `<div style="margin: 40px 0; padding: 20px; border: 2px dashed #f87171; background: #fef2f2; text-align: center; border-radius: 8px;">
  <div style="color: #dc2626; font-weight: bold; margin-bottom: 10px;">⚠️ DADOS OBRIGATÓRIOS</div>
  <div style="color: #666; font-size: 14px;">
    Para gerar gráficos, você deve anexar arquivos contendo dados (CSV, JSON, TXT, etc.)
  </div>
  <div style="color: #888; font-size: 12px; margin-top: 10px;">
    Tag encontrada: ${tag}
  </div>
</div>`
        processedContent = processedContent.replace(tag, errorMessage)
      })
      
      return processedContent
    }

    console.log(`📊 Encontradas ${chartTags.length} tags de gráfico, processando com ${dataFiles.length} arquivo(s) de dados...`)
    
    // Filtrar apenas arquivos de dados (não imagens)
    const actualDataFiles = dataFiles.filter(file => 
      file.type === 'data' || 
      file.fileName.toLowerCase().match(/\.(csv|json|txt|xlsx|xls)$/)
    )

    if (actualDataFiles.length === 0) {
      console.warn('⚠️ Nenhum arquivo de dados encontrado entre os anexos')
      
      // Substituir tags por aviso
      let processedContent = content
      chartTags.forEach(tag => {
        const warningMessage = `<div style="margin: 40px 0; padding: 20px; border: 2px dashed #f59e0b; background: #fffbeb; text-align: center; border-radius: 8px;">
  <div style="color: #d97706; font-weight: bold; margin-bottom: 10px;">📊 DADOS NECESSÁRIOS</div>
  <div style="color: #666; font-size: 14px;">
    Anexe arquivos com dados estruturados (CSV, JSON, TXT) para gerar este gráfico
  </div>
  <div style="color: #888; font-size: 12px; margin-top: 10px;">
    Tag: ${tag}
  </div>
</div>`
        processedContent = processedContent.replace(tag, warningMessage)
      })
      
      return processedContent
    }

    // Processar os gráficos usando a nova API process-charts
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/process-charts-new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        content: content,
        dataFiles: actualDataFiles,
        context: 'Artigo científico'
      })
    })

    if (!response.ok) {
      console.error('❌ Erro na API process-charts-new:', response.statusText)
      const errorData = await response.json()
      console.error('❌ Detalhes do erro:', errorData)
      
      // Em caso de erro, substituir tags por mensagem explicativa
      let processedContent = content
      chartTags.forEach(tag => {
        const errorMessage = `<div style="margin: 40px 0; padding: 20px; border: 2px dashed #f87171; background: #fef2f2; text-align: center; border-radius: 8px;">
  <div style="color: #dc2626; font-weight: bold; margin-bottom: 10px;">❌ ERRO NA GERAÇÃO</div>
  <div style="color: #666; font-size: 14px;">
    ${errorData.message || 'Não foi possível gerar o gráfico a partir dos dados fornecidos'}
  </div>
  <div style="color: #888; font-size: 12px; margin-top: 10px;">
    Tag: ${tag}
  </div>
</div>`
        processedContent = processedContent.replace(tag, errorMessage)
      })
      
      return processedContent
    }

    const result = await response.json()
    
    if (result.success && result.chartImages) {
      console.log(`✅ ${Object.keys(result.chartImages).length} gráficos processados baseados em dados`)
      
      // Substituir tags pelos gráficos gerados
      let processedContent = content
      for (const [chartId, imgTag] of Object.entries(result.chartImages)) {
        const chartTag = `[CHART:${chartId}]`
        processedContent = processedContent.replace(chartTag, imgTag as string)
      }
      
      return processedContent
    } else {
      console.error('❌ Falha no processamento de gráficos:', result.error)
      return content
    }
    
  } catch (error) {
    console.error('❌ Erro no processamento de gráficos:', error)
    return content
  }
}

// Função para gerar dados de exemplo baseados no ID do gráfico
function generateSampleData(chartId: string) {
  const id = chartId.toLowerCase()
  
  if (id.includes('metodologia') || id.includes('processo')) {
    return {
      categories: ['Etapa 1', 'Etapa 2', 'Etapa 3', 'Etapa 4'],
      values: [25, 45, 78, 92]
    }
  } else if (id.includes('resultado') || id.includes('dados')) {
    return {
      categories: ['Grupo A', 'Grupo B', 'Grupo C'],
      values: [67, 84, 72]
    }
  } else if (id.includes('comparativ') || id.includes('analise')) {
    return {
      categories: ['Método 1', 'Método 2', 'Método 3', 'Proposto'],
      values: [45, 62, 58, 89]
    }
  } else {
    // Dados genéricos
    return {
      categories: ['A', 'B', 'C', 'D', 'E'],
      values: [23, 45, 67, 56, 78]
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Dados recebidos na API generate-article:', JSON.stringify(body, null, 2))
    
    const { 
      articleId,
      title, 
      abstract, 
      keywords, 
      fieldOfStudy, 
      methodology, 
      targetJournal,
      authors,
      literatureSuggestions,
      sectionType, // Para gerar seções específicas
      userId,
      attachedFiles, // Arquivos enviados pelo usuário
      includeCharts, // Indicador para gerar gráficos
      includeTables // Indicador para gerar tabelas
    } = body

    if (attachedFiles && attachedFiles.length > 0) {
      console.log('Arquivos anexados recebidos:')
      attachedFiles.forEach((file: any, index: number) => {
        console.log(`  Arquivo ${index + 1}:`, {
          name: file.name,
          fileName: file.fileName,
          type: file.type,
          size: file.size
        })
      })
    }

    if (!title && !sectionType) {
      return NextResponse.json(
        { error: 'Título ou tipo de seção é obrigatório' },
        { status: 400 }
      )
    }

    let generatedContent = ''
      // Gerar artigo completo
    generatedContent = await GeminiService.generateArticle({
      title,
      abstract,
      keywords,
      fieldOfStudy,
      methodology,
      targetJournal,
      authors,
      literatureSuggestions,
      attachedFiles,
      includeCharts,
      includeTables
    })

    // Processar tags de imagem para buscar arquivos na pasta uploads
    generatedContent = await processImageTags(generatedContent)

    // Se includeCharts for verdadeiro, processar gráficos automaticamente
    if (includeCharts) {
      console.log('📊 Processando gráficos automaticamente com base nos dados fornecidos...')
      
      // Filtrar arquivos de dados dos anexos
      const dataFiles = attachedFiles?.filter((file: any) => 
        file.type === 'data' || 
        file.fileName.toLowerCase().match(/\.(csv|json|txt|xlsx|xls)$/)
      ) || []
      
      generatedContent = await processChartsInContent(generatedContent, dataFiles)
    }

    // Se articleId for fornecido, atualizar o artigo existente
    if (articleId) {
      const updatedArticle = await ArticleService.update(articleId, {
        content: generatedContent
      })
      
      return NextResponse.json({
        success: true,
        content: generatedContent,
        article: updatedArticle
      })
    }

    // Senão, criar novo artigo se userId for fornecido
    if (userId) {
      const newArticle = await ArticleService.create({
        title,
        content: generatedContent,
        userId
      })

      return NextResponse.json({
        success: true,
        content: generatedContent,
        article: newArticle
      })
    }

    // Apenas retornar o conteúdo gerado
    return NextResponse.json({
      success: true,
      content: generatedContent
    })

  } catch (error) {
    console.error('Erro na geração do artigo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
