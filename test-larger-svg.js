// Teste dos gráficos SVG com tamanho maior
const testData = {
  charts: [],
  dataFiles: [{
    fileName: 'vendas_trimestre.csv',
    content: `Trimestre,Vendas,Meta
Q1 2024,180000,150000
Q2 2024,220000,180000
Q3 2024,280000,200000
Q4 2024,320000,250000`,
    type: 'text/csv',
    size: '98 bytes'
  }],
  content: `Análise de performance de vendas por trimestre:

[CHART:vendas_vs_meta] - Comparação de vendas versus metas por trimestre

Os resultados mostram crescimento consistente ao longo do ano.`,
  context: 'Análise trimestral para demonstrar gráficos maiores'
}

async function testLargerSVG() {
  console.log('🧪 Testando geração de gráficos SVG com tamanho maior...\n')
  
  try {
    const response = await fetch('http://localhost:3001/api/process-charts-new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    })

    const result = await response.json()
    
    console.log('📊 Resultado do teste:')
    console.log(`✅ Status: ${response.status}`)
    console.log(`✅ Sucesso: ${result.success}`)
    console.log(`✅ Mensagem: ${result.message}`)
    
    if (result.chartImages) {
      console.log('\n🎨 Gráficos gerados:')
      Object.keys(result.chartImages).forEach(id => {
        const chartHtml = result.chartImages[id]
        const isSVG = chartHtml.includes('<svg')
        const hasLargeViewBox = chartHtml.includes('viewBox="0 0 1200 800"')
        const hasLargeMaxWidth = chartHtml.includes('max-width: 1200px')
        
        console.log(`\n📈 Gráfico ${id}:`)
        console.log(`   📝 Tamanho: ${chartHtml.length} caracteres`)
        console.log(`   🖼️ Formato: ${isSVG ? 'SVG inline ✅' : 'Imagem ❌'}`)
        console.log(`   📐 ViewBox 1200x800: ${hasLargeViewBox ? 'Sim ✅' : 'Não ❌'}`)
        console.log(`   📱 Max-width 1200px: ${hasLargeMaxWidth ? 'Sim ✅' : 'Não ❌'}`)
        
        if (isSVG) {
          // Verificar dimensões no SVG
          const widthMatch = chartHtml.match(/width="(\d+)"/)
          const heightMatch = chartHtml.match(/height="(\d+)"/)
          const viewBoxMatch = chartHtml.match(/viewBox="0 0 (\d+) (\d+)"/)
          
          if (widthMatch && heightMatch) {
            console.log(`   📏 Dimensões originais: ${widthMatch[1]}x${heightMatch[1]}`)
          }
          
          if (viewBoxMatch) {
            console.log(`   📐 ViewBox: ${viewBoxMatch[1]}x${viewBoxMatch[2]}`)
          }
          
          // Verificar se tem dados
          const hasData = chartHtml.includes('Q1') || chartHtml.includes('180000') || chartHtml.includes('Vendas')
          console.log(`   📊 Dados presentes: ${hasData ? 'Sim ✅' : 'Não ❌'}`)
          
          // Preview pequeno
          console.log(`\n📄 Início do HTML:`)
          console.log(chartHtml.substring(0, 200) + '...\n')
        }
      })
    }
    
    console.log('\n🎯 Verificação de tamanho:')
    if (result.success && result.chartImages) {
      const hasLargeSVG = Object.values(result.chartImages).some(html => 
        html.includes('max-width: 1200px') && html.includes('viewBox="0 0 1200 800"')
      )
      
      if (hasLargeSVG) {
        console.log('✅ SUCESSO: Gráficos agora são gerados em tamanho maior (1200x800)!')
        console.log('✅ Max-width configurado para 1200px - gráficos mais visíveis!')
      } else {
        console.log('❌ PROBLEMA: Gráficos ainda não estão no tamanho maior.')
      }
    } else {
      console.log('❌ ERRO: Falha na geração de gráficos.')
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

// Executar o teste
testLargerSVG()
