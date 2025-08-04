import { NextResponse } from 'next/server'
import { ChartToImageService } from '@/lib/utils/chart-to-image'

export async function POST(request: Request) {
  try {
    console.log('🎨 API: Processando gráficos para imagens')
    
    const { charts } = await request.json()
    
    if (!charts || !Array.isArray(charts)) {
      return NextResponse.json(
        { error: 'Charts array is required' },
        { status: 400 }
      )
    }

    console.log(`📊 Processando ${charts.length} gráficos`)
    
    // Processar todos os gráficos
    const chartImages = await ChartToImageService.processChartsToImages(charts)
    
    // Converter Map para objeto para resposta JSON
    const result = Object.fromEntries(chartImages)
    
    console.log('✅ Gráficos convertidos para imagens:', result)
    
    return NextResponse.json({
      success: true,
      chartImages: result,
      count: chartImages.size
    })
    
  } catch (error) {
    console.error('❌ Erro ao processar gráficos:', error)
    return NextResponse.json(
      { error: 'Failed to process charts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
