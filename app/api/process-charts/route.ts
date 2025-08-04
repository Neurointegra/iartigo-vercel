import { NextRequest, NextResponse } from 'next/server'
import { GeminiService } from '@/lib/services/gemini.service'
import { generateChartSVG, saveSVGToFile } from '@/lib/utils/svg-generator'

interface ChartData {
  id: string
  name: string
  type: 'bar' | 'line' | 'pie' | 'scatter'
  data: any
  description: string
  referenceId: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🎨 API process-charts recebida:', JSON.stringify(body, null, 2))
    
    const { charts }: { charts: ChartData[] } = body

    if (!charts || !Array.isArray(charts) || charts.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum gráfico fornecido para processamento' },
        { status: 400 }
      )
    }

    console.log(`📊 Processando ${charts.length} gráficos...`)
    
    const chartImages: Record<string, string> = {}
    const errors: string[] = []

    // Processar cada gráfico
    for (const chart of charts) {
      try {
        console.log(`🎯 Processando gráfico: ${chart.id} (${chart.type})`)
        
        // Criar prompt baseado no tipo e dados do gráfico
        const chartPrompt = createChartPrompt(chart)
        
        // Gerar e salvar imagem usando GeminiService
        const result = await GeminiService.generateAndSaveImage(
          chartPrompt,
          `chart_${chart.id}`,
          {
            width: 800,
            height: 600,
            context: 'artigo científico'
          }
        )

        console.log(`🖼️ Resultado da geração para ${chart.id}:`, result)

        if (result.success && result.publicUrl) {
          // Criar tag IMG diretamente com o link da imagem
          const imgTag = `<div style="margin: 40px 0; text-align: center;">
  <img 
    src="${result.publicUrl}" 
    alt="${chart.name}" 
    style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" 
  />
  <p style="margin: 10px 0 0 0; font-style: italic; color: #666; font-size: 14px; text-align: center;">
    ${chart.description || chart.name}
  </p>
</div>`
          
          chartImages[chart.id] = imgTag
          console.log(`✅ Gráfico ${chart.id} gerado pela IA: ${result.publicUrl}`)
          
        } else {
          console.log(`⚠️ IA falhou para ${chart.id}, gerando SVG fallback...`)
          
          // Fallback: Gerar SVG simples
          const svgContent = generateChartSVG(
            chart.type as 'bar' | 'line' | 'pie' | 'scatter',
            chart.data,
            chart.name,
            800,
            600
          )
          
          const svgResult = await saveSVGToFile(svgContent, `chart_${chart.id}`)
          
          if (svgResult.success && svgResult.publicUrl) {
            const imgTag = `<div style="margin: 40px 0; text-align: center;">
  <img 
    src="${svgResult.publicUrl}" 
    alt="${chart.name}" 
    style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" 
  />
  <p style="margin: 10px 0 0 0; font-style: italic; color: #666; font-size: 14px; text-align: center;">
    ${chart.description || chart.name}
  </p>
</div>`
            
            chartImages[chart.id] = imgTag
            console.log(`✅ Gráfico ${chart.id} gerado como SVG: ${svgResult.publicUrl}`)
          } else {
            console.error(`❌ Falha total para ${chart.id}:`, svgResult.error)
            errors.push(`Gráfico ${chart.id}: ${result.error || 'Erro na geração'}`)
            
            // Placeholder final em caso de erro total
            const placeholderImg = `<div style="margin: 40px 0; text-align: center;">
  <div style="width: 800px; height: 400px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; background: #f9f9f9; margin: 0 auto; border-radius: 8px;">
    <div style="text-align: center; color: #666;">
      <div style="font-size: 24px; margin-bottom: 10px;">📊</div>
      <div style="font-weight: bold;">${chart.name}</div>
      <div style="font-size: 12px; margin-top: 5px;">Gráfico ${chart.type} - Erro na geração</div>
    </div>
  </div>
  <p style="margin: 10px 0 0 0; font-style: italic; color: #666; font-size: 14px;">
    ${chart.description || chart.name}
  </p>
</div>`
            
            chartImages[chart.id] = placeholderImg
          }
        }
        
      } catch (error) {
        console.error(`❌ Erro ao processar gráfico ${chart.id}:`, error)
        errors.push(`Gráfico ${chart.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
        
        // Criar placeholder HTML em caso de erro
        const errorImg = `<div style="margin: 40px 0; text-align: center;">
  <div style="width: 800px; height: 400px; border: 2px dashed #ff6b6b; display: flex; align-items: center; justify-content: center; background: #fff5f5; margin: 0 auto; border-radius: 8px;">
    <div style="text-align: center; color: #dc2626;">
      <div style="font-size: 24px; margin-bottom: 10px;">⚠️</div>
      <div style="font-weight: bold;">${chart.name}</div>
      <div style="font-size: 12px; margin-top: 5px;">Erro na geração do gráfico ${chart.type}</div>
    </div>
  </div>
  <p style="margin: 10px 0 0 0; font-style: italic; color: #666; font-size: 14px;">
    ${chart.description || chart.name}
  </p>
</div>`
        
        chartImages[chart.id] = errorImg
      }
    }

    const successCount = Object.keys(chartImages).length
    console.log(`✅ Processamento concluído: ${successCount}/${charts.length} gráficos`)
    
    if (errors.length > 0) {
      console.warn('⚠️ Erros encontrados:', errors)
    }

    return NextResponse.json({
      success: true,
      chartImages, // Agora contém HTML direto com tags <img>
      stats: {
        total: charts.length,
        generated: successCount,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('❌ Erro na API process-charts:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

function createChartPrompt(chart: ChartData): string {
  const chartTypeMap = {
    bar: 'gráfico de barras',
    line: 'gráfico de linha',
    pie: 'gráfico de pizza',
    scatter: 'gráfico de dispersão'
  }

  const basePrompt = `
Crie um ${chartTypeMap[chart.type]} profissional para artigo científico:

TÍTULO: ${chart.name}
DESCRIÇÃO: ${chart.description}
DADOS: ${JSON.stringify(chart.data, null, 2)}

ESPECIFICAÇÕES:
- Fundo branco limpo
- Cores acadêmicas: Azul #2563EB, Verde #059669, Laranja #F59E0B
- Tipografia clara e legível
- Grid discreto para facilitar leitura
- Legendas e rótulos bem posicionados
- Layout profissional para publicação científica
  `

  // Adicionar especificações específicas por tipo
  switch (chart.type) {
    case 'bar':
      return basePrompt + `
- Barras com espaçamento adequado
- Valores exibidos no topo das barras se necessário
- Eixos X e Y claramente rotulados
- Categorias bem distribuídas
      `
    
    case 'line':
      return basePrompt + `
- Linha suave e bem definida
- Pontos de dados marcados claramente
- Grid horizontal para facilitar leitura
- Eixos com escalas apropriadas
      `
    
    case 'pie':
      return basePrompt + `
- Fatias bem proporcionais aos valores
- Percentuais exibidos em cada fatia
- Cores contrastantes entre fatias
- Legenda lateral ou integrada
      `
    
    case 'scatter':
      return basePrompt + `
- Pontos bem visíveis
- Eixos com escalas lineares
- Linha de tendência se aplicável
- Distribuição clara dos dados
      `
    
    default:
      return basePrompt
  }
}
