// Teste do sistema de geração de gráficos

const { generateChartSVG, saveSVGToFile } = require('../lib/utils/svg-generator')

async function testChartGeneration() {
  console.log('🧪 Testando geração de gráficos...')
  
  const testData = {
    categories: ['A', 'B', 'C', 'D'],
    values: [25, 45, 70, 85]
  }
  
  const svgContent = generateChartSVG('bar', testData, 'Teste de Gráfico', 800, 600)
  
  console.log('📊 SVG gerado:')
  console.log(svgContent.substring(0, 200) + '...')
  
  const saveResult = await saveSVGToFile(svgContent, 'test_chart')
  
  if (saveResult.success) {
    console.log('✅ Teste bem-sucedido!')
    console.log('📁 Arquivo salvo em:', saveResult.publicUrl)
  } else {
    console.error('❌ Teste falhou:', saveResult.error)
  }
}

testChartGeneration().catch(console.error)
