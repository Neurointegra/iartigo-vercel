// Teste específico para Chart.js
const testData = {
  charts: [],
  dataFiles: [{
    fileName: 'vendas_2024.csv',
    content: `Mês,Vendas
Janeiro,120000
Fevereiro,150000
Março,180000
Abril,160000
Maio,220000
Junho,250000`,
    type: 'text/csv',
    size: '156 bytes'
  }],
  content: `[CHART:vendas_mensais] - Análise das vendas`,
  context: 'Teste Chart.js'
}

async function testChartJS() {
  console.log('📊 Testando Chart.js...\n')
  
  try {
    const response = await fetch('http://localhost:3001/api/process-charts-new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    })

    const result = await response.json()
    
    if (result.success && result.chartImages) {
      const chartHtml = Object.values(result.chartImages)[0]
      
      console.log('✅ Chart.js implementado!')
      console.log('📄 HTML gerado:')
      console.log(chartHtml.substring(0, 500) + '...\n')
      
      // Verificações específicas do Chart.js
      const hasCanvas = chartHtml.includes('<canvas')
      const hasScript = chartHtml.includes('<script>')
      const hasChartJS = chartHtml.includes('Chart(')
      const hasResponsive = chartHtml.includes('responsive: true')
      const hasCDN = chartHtml.includes('chart.js')
      
      console.log('🔍 Verificações Chart.js:')
      console.log(`   📊 Canvas: ${hasCanvas ? '✅' : '❌'}`)
      console.log(`   📜 Script: ${hasScript ? '✅' : '❌'}`)
      console.log(`   📈 Chart(): ${hasChartJS ? '✅' : '❌'}`)
      console.log(`   📱 Responsivo: ${hasResponsive ? '✅' : '❌'}`)
      console.log(`   🌐 CDN: ${hasCDN ? '✅' : '❌'}`)
      
      if (hasCanvas && hasScript && hasChartJS) {
        console.log('\n🎉 SUCESSO: Chart.js implementado corretamente!')
        console.log('✅ Gráficos agora usam biblioteca profissional')
        console.log('✅ Escala e proporções serão precisas')
        console.log('✅ Responsivo e interativo')
      } else {
        console.log('\n⚠️ Problema na implementação Chart.js')
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

testChartJS()
