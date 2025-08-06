// Teste dos gráficos SVG inline
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
  content: `Este artigo contém análises de vendas com os seguintes gráficos:

[CHART:vendas_mensais] - Vendas mensais de 2024

Como podemos ver no gráfico acima, houve um crescimento consistente.`,
  context: 'Análise de vendas para demonstrar gráficos SVG inline'
}

async function testSVGInline() {
  console.log('🧪 Testando geração de gráficos SVG inline...\n')
  
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
        const isResponsive = chartHtml.includes('viewBox') || chartHtml.includes('max-width')
        
        console.log(`\n📈 Gráfico ${id}:`)
        console.log(`   📝 Tamanho: ${chartHtml.length} caracteres`)
        console.log(`   🖼️ Formato: ${isSVG ? 'SVG inline ✅' : 'Imagem ❌'}`)
        console.log(`   📱 Responsivo: ${isResponsive ? 'Sim ✅' : 'Não ❌'}`)
        
        if (isSVG) {
          const hasTitle = chartHtml.includes('vendas') || chartHtml.includes('Vendas')
          const hasData = chartHtml.includes('Janeiro') || chartHtml.includes('150000')
          console.log(`   📊 Dados presentes: ${hasData ? 'Sim ✅' : 'Não ❌'}`)
          console.log(`   🏷️ Título presente: ${hasTitle ? 'Sim ✅' : 'Não ❌'}`)
          
          // Salvar exemplo para análise
          console.log(`\n📄 Preview do HTML gerado:`)
          console.log(chartHtml.substring(0, 300) + '...\n')
        }
      })
    }
    
    if (result.results) {
      console.log('\n📋 Detalhes dos resultados:')
      result.results.forEach(r => {
        console.log(`   ${r.id}: ${r.status} ${r.type ? `(${r.type})` : ''}`)
      })
    }

    console.log('\n🎯 Conclusão:')
    if (result.success && result.chartImages) {
      const hasInlineSVG = Object.values(result.chartImages).some(html => html.includes('<svg'))
      if (hasInlineSVG) {
        console.log('✅ TESTE PASSOU: Gráficos SVG inline funcionando corretamente!')
        console.log('✅ Os gráficos agora são responsivos e não dependem de arquivos externos.')
      } else {
        console.log('❌ PROBLEMA: Gráficos não estão sendo gerados como SVG inline.')
      }
    } else {
      console.log('❌ ERRO: Falha na geração de gráficos.')
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

// Executar o teste
testSVGInline()
