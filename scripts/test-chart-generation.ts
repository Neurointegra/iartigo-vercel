import { ChartToImageService } from '@/lib/utils/chart-to-image'

async function testChartGeneration() {
  console.log('🧪 Testando geração de gráficos...')
  
  const testCharts = [
    {
      id: 'test_bar',
      name: 'Gráfico de Barras Teste',
      type: 'bar' as const,
      data: {
        labels: ['A', 'B', 'C', 'D'],
        datasets: [{
          data: [10, 20, 30, 40]
        }]
      },
      description: 'Teste de gráfico de barras',
      context: 'Teste'
    },
    {
      id: 'test_line',
      name: 'Gráfico de Linha Teste',
      type: 'line' as const,
      data: {
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [{
          data: [15, 25, 35]
        }]
      },
      description: 'Teste de gráfico de linha',
      context: 'Teste'
    }
  ]
  
  try {
    const result = await ChartToImageService.processChartsToImages(testCharts)
    console.log('✅ Gráficos gerados com sucesso:', Object.fromEntries(result))
    return true
  } catch (error) {
    console.error('❌ Erro no teste:', error)
    return false
  }
}

// Executar apenas se for chamado diretamente
if (require.main === module) {
  testChartGeneration()
}

export { testChartGeneration }
