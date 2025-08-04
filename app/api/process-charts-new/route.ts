import { NextRequest, NextResponse } from 'next/server'
import { GeminiService } from '@/lib/services/gemini.service'
import { saveSVGToFile } from '@/lib/utils/svg-generator'

interface ChartData {
  id: string
  name: string
  type: 'bar' | 'line' | 'pie' | 'scatter'
  data: any
  description: string
  referenceId: string
  analysisContext?: string
}

interface DataFile {
  fileName: string
  content: string
  type: string
  size: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🎨 API process-charts recebida (NOVO SISTEMA BASEADO EM DADOS)')
    
    const { 
      charts, 
      dataFiles, 
      content, 
      context 
    }: { 
      charts?: ChartData[], 
      dataFiles?: DataFile[], 
      content?: string,
      context?: string 
    } = body

    // NOVA ABORDAGEM: Dados obrigatórios
    if (!dataFiles || !Array.isArray(dataFiles) || dataFiles.length === 0) {
      console.error('❌ ERRO: Dados não fornecidos')
      return NextResponse.json(
        { 
          error: 'DADOS OBRIGATÓRIOS: Para gerar gráficos, você deve fornecer arquivos de dados',
          message: 'O novo sistema requer que você anexe arquivos contendo dados (CSV, JSON, TXT, Excel, etc.) para análise e geração de gráficos.',
          solution: 'Anexe pelo menos um arquivo com dados numéricos ou estruturados na interface de geração de artigo'
        },
        { status: 400 }
      )
    }

    console.log(`📊 NOVO SISTEMA: Analisando ${dataFiles.length} arquivo(s) de dados...`)
    
    // Se há gráficos específicos solicitados E dados fornecidos
    if (charts && Array.isArray(charts) && charts.length > 0) {
      console.log(`🎯 Processando ${charts.length} gráficos específicos com dados fornecidos...`)
      return await processChartsWithData(charts, dataFiles, context)
    }
    
    // Se há apenas conteúdo com tags [CHART:] e dados fornecidos
    if (content && content.includes('[CHART:')) {
      console.log('🔍 Detectadas tags [CHART:] no conteúdo, analisando dados...')
      return await processContentChartsWithData(content, dataFiles, context)
    }

    // Se há apenas dados (gerar gráficos automaticamente)
    console.log('🤖 Gerando gráficos automaticamente baseado nos dados fornecidos...')
    return await analyzeDataAndGenerateCharts(dataFiles, context)

  } catch (error) {
    console.error('❌ Erro na API process-charts:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno no processamento',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

// Processar gráficos específicos com dados fornecidos
async function processChartsWithData(
  charts: ChartData[], 
  dataFiles: DataFile[], 
  context?: string
): Promise<NextResponse> {
  console.log('🎯 Processando gráficos específicos com análise de dados...')
  
  const chartImages: Record<string, string> = {}
  const results: any[] = []

  for (const chart of charts) {
    try {
      console.log(`📊 Processando gráfico: ${chart.id}`)
      
      // Enriquecer gráfico com análise de dados relevantes
      const enrichedChart = await enrichChartWithData(chart, dataFiles, context)
      
      // Gerar SVG usando IA com dados reais
      const svgResult = await GeminiService.generateDataDrivenSVG({
        ...enrichedChart,
        analysisContext: enrichedChart.analysisContext || 'Gráfico baseado em dados fornecidos'
      }, 800, 600)
      
      if (svgResult.success && svgResult.svgContent) {
        const saveResult = await saveSVGToFile(svgResult.svgContent, `chart_${chart.id}`)
        
        if (saveResult.success && saveResult.publicUrl) {
          const imgTag = createChartImageTag(enrichedChart, saveResult.publicUrl, dataFiles)
          chartImages[chart.id] = imgTag
          results.push({ id: chart.id, status: 'success', url: saveResult.publicUrl })
          console.log(`✅ Gráfico gerado: ${chart.id}`)
        } else {
          results.push({ id: chart.id, status: 'error', error: 'Falha ao salvar SVG' })
        }
      } else {
        results.push({ id: chart.id, status: 'error', error: svgResult.error })
      }
      
    } catch (error) {
      console.error(`❌ Erro no gráfico ${chart.id}:`, error)
      results.push({ 
        id: chart.id, 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      })
    }
  }

  const successCount = results.filter(r => r.status === 'success').length
  
  return NextResponse.json({
    success: successCount > 0,
    message: `${successCount}/${charts.length} gráficos gerados com base nos dados fornecidos`,
    chartImages,
    results
  })
}

// Processar conteúdo com tags [CHART:] usando dados fornecidos
async function processContentChartsWithData(
  content: string, 
  dataFiles: DataFile[], 
  context?: string
): Promise<NextResponse> {
  console.log('🔍 Processando tags [CHART:] com análise de dados...')
  
  // Encontrar tags [CHART:id] no conteúdo
  const chartTags = content.match(/\[CHART:([^\]]+)\]/g)
  
  if (!chartTags || chartTags.length === 0) {
    return NextResponse.json(
      { error: 'Nenhuma tag [CHART:] encontrada no conteúdo' },
      { status: 400 }
    )
  }

  console.log(`📊 Encontradas ${chartTags.length} tags de gráfico`)
  
  // Primeiro, analisar dados para identificar gráficos possíveis
  const allAnalyzedCharts: any[] = []
  
  for (const dataFile of dataFiles) {
    const analysisResult = await GeminiService.analyzeDataForCharts(
      dataFile.content,
      context || 'Artigo científico',
      dataFile.fileName
    )
    
    if (analysisResult.success) {
      allAnalyzedCharts.push(...analysisResult.charts)
    }
  }

  if (allAnalyzedCharts.length === 0) {
    return NextResponse.json(
      { 
        error: 'Nenhum gráfico pôde ser gerado a partir dos dados fornecidos',
        message: 'Verifique se os arquivos contêm dados estruturados ou numéricos válidos'
      },
      { status: 400 }
    )
  }

  // Mapear tags para gráficos analisados
  const chartImages: Record<string, string> = {}
  const results: any[] = []

  for (const tag of chartTags) {
    const chartId = tag.replace(/\[CHART:([^\]]+)\]/, '$1')
    
    // Encontrar melhor gráfico correspondente ou usar o primeiro disponível
    let selectedChart = allAnalyzedCharts.find(c => 
      c.id.toLowerCase().includes(chartId.toLowerCase()) ||
      c.name.toLowerCase().includes(chartId.toLowerCase())
    ) || allAnalyzedCharts[0]

    if (selectedChart) {
      // Atualizar ID para corresponder à tag
      selectedChart = { ...selectedChart, id: chartId }
      
      try {
        const svgResult = await GeminiService.generateDataDrivenSVG(selectedChart, 800, 600)
        
        if (svgResult.success && svgResult.svgContent) {
          const saveResult = await saveSVGToFile(svgResult.svgContent, `chart_${chartId}`)
          
          if (saveResult.success && saveResult.publicUrl) {
            const imgTag = createChartImageTag(selectedChart, saveResult.publicUrl, dataFiles)
            chartImages[chartId] = imgTag
            results.push({ id: chartId, status: 'success', url: saveResult.publicUrl })
            console.log(`✅ Gráfico gerado para tag ${tag}`)
          }
        }
      } catch (error) {
        console.error(`❌ Erro ao gerar gráfico para ${tag}:`, error)
        results.push({ id: chartId, status: 'error', error: 'Falha na geração' })
      }
      
      // Remover gráfico usado da lista
      const usedIndex = allAnalyzedCharts.findIndex(c => c === selectedChart)
      if (usedIndex > -1) {
        allAnalyzedCharts.splice(usedIndex, 1)
      }
    }
  }

  const successCount = results.filter(r => r.status === 'success').length
  
  return NextResponse.json({
    success: successCount > 0,
    message: `${successCount}/${chartTags.length} gráficos gerados baseados nos dados fornecidos`,
    chartImages,
    results
  })
}

// Analisar dados e gerar gráficos automaticamente
async function analyzeDataAndGenerateCharts(
  dataFiles: DataFile[], 
  context?: string
): Promise<NextResponse> {
  console.log('🤖 Gerando gráficos automaticamente a partir da análise de dados...')
  
  const allCharts: any[] = []
  const analysisResults: any[] = []

  // Analisar cada arquivo
  for (const dataFile of dataFiles) {
    const analysisResult = await GeminiService.analyzeDataForCharts(
      dataFile.content,
      context || 'Artigo científico',
      dataFile.fileName
    )

    if (analysisResult.success && analysisResult.charts.length > 0) {
      allCharts.push(...analysisResult.charts)
      analysisResults.push({
        fileName: dataFile.fileName,
        chartsCount: analysisResult.charts.length
      })
    }
  }

  if (allCharts.length === 0) {
    return NextResponse.json(
      { 
        error: 'Nenhum gráfico identificado nos dados fornecidos',
        message: 'Os arquivos não contêm dados estruturados suficientes para gerar visualizações'
      },
      { status: 400 }
    )
  }

  // Gerar SVGs para todos os gráficos identificados
  const chartImages: Record<string, string> = {}
  const results: any[] = []

  for (const chart of allCharts) {
    try {
      const svgResult = await GeminiService.generateDataDrivenSVG(chart, 800, 600)
      
      if (svgResult.success && svgResult.svgContent) {
        const saveResult = await saveSVGToFile(svgResult.svgContent, `chart_${chart.id}`)
        
        if (saveResult.success && saveResult.publicUrl) {
          const imgTag = createChartImageTag(chart, saveResult.publicUrl, dataFiles)
          chartImages[chart.id] = imgTag
          results.push({ id: chart.id, status: 'success', url: saveResult.publicUrl })
        }
      }
    } catch (error) {
      results.push({ id: chart.id, status: 'error', error: 'Falha na geração' })
    }
  }

  const successCount = results.filter(r => r.status === 'success').length
  
  return NextResponse.json({
    success: successCount > 0,
    message: `${successCount} gráficos gerados automaticamente a partir dos dados`,
    chartImages,
    results,
    analysisResults
  })
}

// Enriquecer gráfico com dados relevantes dos arquivos
async function enrichChartWithData(
  chart: ChartData, 
  dataFiles: DataFile[], 
  context?: string
): Promise<ChartData> {
  // Se o gráfico já tem dados estruturados, usar como está
  if (chart.data && Object.keys(chart.data).length > 0) {
    return {
      ...chart,
      analysisContext: `Gráfico ${chart.type} baseado em dados fornecidos: ${chart.description}`
    }
  }

  // Caso contrário, tentar extrair dados relevantes dos arquivos
  const combinedData = dataFiles.map(f => `${f.fileName}:\n${f.content}`).join('\n\n')
  
  const analysisResult = await GeminiService.analyzeDataForCharts(
    combinedData,
    context || 'Artigo científico',
    `Dados para ${chart.id}`
  )

  if (analysisResult.success && analysisResult.charts.length > 0) {
    const relevantChart = analysisResult.charts.find(c => 
      c.type === chart.type || 
      c.id.includes(chart.id) ||
      c.name.toLowerCase().includes(chart.name.toLowerCase())
    ) || analysisResult.charts[0]

    return {
      ...chart,
      data: relevantChart.data,
      description: relevantChart.description,
      analysisContext: relevantChart.analysisContext
    }
  }

  return chart
}

// Criar tag de imagem para gráfico
function createChartImageTag(
  chart: any, 
  publicUrl: string, 
  dataFiles: DataFile[]
): string {
  const dataSource = dataFiles.map(f => f.fileName).join(', ')
  
  return `<div style="margin: 40px 0; text-align: center;">
  <img 
    src="${publicUrl}" 
    alt="${chart.name}" 
    style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" 
  />
  <p style="margin: 10px 0 0 0; font-style: italic; color: #666; font-size: 14px; text-align: center;">
    ${chart.description}
  </p>
  <p style="margin: 5px 0 0 0; font-size: 12px; color: #888; text-align: center;">
    📊 Baseado em: ${dataSource}
  </p>
</div>`
}
