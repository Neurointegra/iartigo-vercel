/**
 * Teste das melhorias nos prompts de gráficos
 * Este script testa se a IA gera gráficos mais precisos e relevantes
 */

const testData = {
  // Dados bem estruturados que devem gerar gráficos válidos
  validData: `
Nome,Idade,Pontuação,Grupo
Ana Silva,25,87.5,Experimental
João Santos,30,76.2,Controle
Maria Costa,28,92.1,Experimental
Pedro Lima,32,68.9,Controle
Carla Moura,26,89.3,Experimental
José Silva,29,71.4,Controle
`,

  // Dados problemáticos que devem ser rejeitados
  problematicData: `
Item A: 10
Item B: 20  
Item C: 30
Categoria 1: 40
`,

  // Contexto científico claro
  context: "Estudo sobre eficácia de metodologia de ensino em grupos experimentais vs controle"
}

async function testImprovedCharts() {
  console.log('🧪 Testando melhorias nos prompts de gráficos...\n')

  try {
    // Teste 1: Dados válidos
    console.log('📊 Teste 1: Dados válidos e bem estruturados')
    const response1 = await fetch('http://localhost:3000/api/analyze-data-charts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataFiles: [{
          fileName: 'dados_validos.csv',
          content: testData.validData,
          type: 'text/csv'
        }],
        context: testData.context
      })
    })

    const result1 = await response1.json()
    console.log('Resultado:', result1)
    console.log(`✅ Gráficos gerados: ${result1.charts?.length || 0}`)
    
    if (result1.charts?.length > 0) {
      result1.charts.forEach((chart, i) => {
        console.log(`  - ${i+1}. ${chart.name} (${chart.type})`)
        console.log(`    Labels: ${chart.data.labels?.join(', ') || 'N/A'}`)
        console.log(`    Values: ${chart.data.values?.join(', ') || 'N/A'}`)
      })
    }

    console.log('\n' + '='.repeat(60) + '\n')

    // Teste 2: Dados problemáticos
    console.log('🚫 Teste 2: Dados problemáticos (devem ser rejeitados)')
    const response2 = await fetch('http://localhost:3000/api/analyze-data-charts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataFiles: [{
          fileName: 'dados_problematicos.txt',
          content: testData.problematicData,
          type: 'text/plain'
        }],
        context: testData.context
      })
    })

    const result2 = await response2.json()
    console.log('Resultado:', result2)
    console.log(`${result2.charts?.length === 0 ? '✅' : '❌'} Gráficos rejeitados corretamente: ${result2.charts?.length || 0}`)

    console.log('\n' + '='.repeat(60) + '\n')

    // Teste 3: Geração de SVG com dados válidos
    if (result1.charts?.length > 0) {
      console.log('🎨 Teste 3: Geração de SVG com primeiro gráfico válido')
      const response3 = await fetch('http://localhost:3000/api/process-charts-new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          charts: [result1.charts[0]],
          dataFiles: [{
            fileName: 'dados_validos.csv',
            content: testData.validData,
            type: 'text/csv'
          }],
          context: testData.context
        })
      })

      const result3 = await response3.json()
      console.log('Status geração SVG:', response3.status)
      console.log('Número de gráficos processados:', result3.processedCharts?.length || 0)
      
      if (result3.processedCharts?.length > 0) {
        const svgChart = result3.processedCharts[0]
        console.log(`✅ SVG gerado: ${svgChart.content?.length || 0} caracteres`)
        console.log(`📁 Salvo como: ${svgChart.fileName || 'N/A'}`)
        
        // Verificar se SVG contém tags corretas
        if (svgChart.content) {
          const hasValidTags = svgChart.content.includes('<svg') && 
                              svgChart.content.includes('</svg>') &&
                              !svgChart.content.includes('<Chart') &&
                              !svgChart.content.includes('[CHART')
          console.log(`${hasValidTags ? '✅' : '❌'} Tags SVG válidas`)
        }
      }
    }

    console.log('\n🎯 Resumo dos testes:')
    console.log('- Dados válidos devem gerar 1-3 gráficos relevantes')
    console.log('- Dados problemáticos devem ser rejeitados (0 gráficos)')
    console.log('- SVG deve conter tags corretas e título específico')
    console.log('- Labels devem ser específicos, não genéricos')

  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

// Executar teste
testImprovedCharts()
