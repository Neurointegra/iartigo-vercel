import { NextRequest, NextResponse } from 'next/server'
import { GeminiService } from '@/lib/services/gemini.service'
import { saveSVGToFile } from '@/lib/utils/svg-generator'

interface DataFile {
  fileName: string
  content: string
  type: string
  size: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📊 API analyze-data-charts recebida')
    
    const { dataFiles, context }: { 
      dataFiles: DataFile[], 
      context?: string 
    } = body

    if (!dataFiles || !Array.isArray(dataFiles) || dataFiles.length === 0) {
      return NextResponse.json(
        { 
          error: 'ERRO: É obrigatório fornecer arquivos de dados para gerar gráficos',
          message: 'Para gerar gráficos, você deve anexar pelo menos um arquivo contendo dados (CSV, TXT, JSON, etc.)'
        },
        { status: 400 }
      )
    }

    console.log(`📄 Analisando ${dataFiles.length} arquivo(s) de dados...`)
    
    const allCharts: any[] = []
    const analysisResults: any[] = []

    // Analisar cada arquivo de dados
    for (const dataFile of dataFiles) {
      console.log(`🔍 Analisando arquivo: ${dataFile.fileName}`)
      
      // Usar a IA para analisar os dados e sugerir gráficos
      const analysisResult = await GeminiService.analyzeDataForCharts(
        dataFile.content,
        context || 'Artigo científico',
        dataFile.fileName
      )

      if (analysisResult.success && analysisResult.charts.length > 0) {
        console.log(`✅ ${analysisResult.charts.length} gráficos identificados em ${dataFile.fileName}`)
        allCharts.push(...analysisResult.charts)
        analysisResults.push({
          fileName: dataFile.fileName,
          chartsCount: analysisResult.charts.length,
          charts: analysisResult.charts.map(c => ({ id: c.id, name: c.name, type: c.type }))
        })
      } else {
        console.warn(`⚠️ Nenhum gráfico identificado em ${dataFile.fileName}:`, analysisResult.error)
        analysisResults.push({
          fileName: dataFile.fileName,
          chartsCount: 0,
          error: analysisResult.error
        })
      }
    }

    if (allCharts.length === 0) {
      return NextResponse.json(
        { 
          error: 'Nenhum gráfico pôde ser gerado a partir dos dados fornecidos',
          message: 'Verifique se os arquivos contêm dados numéricos válidos ou estruturas de dados reconhecíveis',
          analysisResults
        },
        { status: 400 }
      )
    }

    console.log(`📊 Total de ${allCharts.length} gráficos para gerar...`)
    
    const chartImages: Record<string, string> = {}
    const generationResults: any[] = []

    // Gerar SVG para cada gráfico usando IA
    for (const chart of allCharts) {
      try {
        console.log(`🎨 Gerando SVG para: ${chart.id} (${chart.type})`)
        
        // Usar IA para gerar SVG baseado nos dados analisados
        const svgResult = await GeminiService.generateDataDrivenSVG(chart, 800, 600)
        
        if (svgResult.success && svgResult.svgContent) {
          // Salvar SVG como arquivo
          const saveResult = await saveSVGToFile(svgResult.svgContent, `chart_${chart.id}`)
          
          if (saveResult.success && saveResult.publicUrl) {
            // Criar tag IMG com o SVG gerado
            const imgTag = `<div style="margin: 40px 0; text-align: center;">
  <img 
    src="${saveResult.publicUrl}" 
    alt="${chart.name}" 
    style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" 
  />
  <p style="margin: 10px 0 0 0; font-style: italic; color: #666; font-size: 14px; text-align: center;">
    ${chart.description}
  </p>
  <p style="margin: 5px 0 0 0; font-size: 12px; color: #888; text-align: center;">
    Baseado em dados de: ${dataFiles.find(f => chart.analysisContext?.includes(f.fileName))?.fileName || 'dados fornecidos'}
  </p>
</div>`
            
            chartImages[chart.id] = imgTag
            generationResults.push({
              id: chart.id,
              name: chart.name,
              type: chart.type,
              status: 'success',
              url: saveResult.publicUrl
            })
            
            console.log(`✅ SVG gerado e salvo: ${chart.id} -> ${saveResult.publicUrl}`)
          } else {
            console.error(`❌ Erro ao salvar SVG para ${chart.id}:`, saveResult.error)
            generationResults.push({
              id: chart.id,
              name: chart.name,
              type: chart.type,
              status: 'error',
              error: 'Falha ao salvar arquivo SVG'
            })
          }
        } else {
          console.error(`❌ Erro na geração de SVG para ${chart.id}:`, svgResult.error)
          generationResults.push({
            id: chart.id,
            name: chart.name,
            type: chart.type,
            status: 'error',
            error: svgResult.error
          })
        }
        
      } catch (error) {
        console.error(`❌ Erro geral para ${chart.id}:`, error)
        generationResults.push({
          id: chart.id,
          name: chart.name,
          type: chart.type,
          status: 'error',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    const successCount = generationResults.filter(r => r.status === 'success').length
    const errorCount = generationResults.filter(r => r.status === 'error').length

    console.log(`🎯 Resultado final: ${successCount} sucessos, ${errorCount} erros`)

    return NextResponse.json({
      success: successCount > 0,
      message: `${successCount} gráfico(s) gerado(s) com sucesso${errorCount > 0 ? `, ${errorCount} com erro` : ''}`,
      chartImages,
      analysisResults,
      generationResults,
      statistics: {
        totalFiles: dataFiles.length,
        totalChartsIdentified: allCharts.length,
        totalChartsGenerated: successCount,
        totalErrors: errorCount
      }
    })

  } catch (error) {
    console.error('❌ Erro na API analyze-data-charts:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno na análise de dados',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
