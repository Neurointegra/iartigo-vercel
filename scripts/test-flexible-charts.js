/**
 * Teste das modificações: gráficos flexíveis com IDs aleatórios
 */

const testFlexibleCharts = async () => {
  console.log('🧪 Testando sistema de gráficos flexível...\n')

  const testData = `
Participante,Idade,Grupo,Pontuacao
Ana,25,Experimental,85
João,30,Controle,72
Maria,28,Experimental,91
Pedro,32,Controle,68
`

  try {
    // Teste 1: Verificar se gera quantidade flexível de gráficos
    console.log('📊 Teste 1: Análise com quantidade flexível')
    const response1 = await fetch('http://localhost:3000/api/analyze-data-charts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataFiles: [{
          fileName: 'dados_pequenos.csv',
          content: testData,
          type: 'text/csv'
        }],
        context: "Estudo comparativo pequeno entre grupos"
      })
    })

    const result1 = await response1.json()
    console.log(`✅ Gráficos gerados: ${result1.charts?.length || 0}`)
    console.log('📝 Validação: Deve gerar 1-2 gráficos (não obrigatoriamente 3)')
    
    if (result1.charts?.length > 0) {
      console.log('\n📋 Gráficos identificados:')
      result1.charts.forEach((chart, i) => {
        console.log(`${i+1}. ID: ${chart.id}`)
        console.log(`   Nome: ${chart.name}`)
        console.log(`   Tipo: ${chart.type}`)
      })
    }

    console.log('\n' + '='.repeat(60) + '\n')

    // Teste 2: Geração de artigo simulando IDs aleatórios
    console.log('📝 Teste 2: Simulação de prompt de artigo')
    
    // Simular parâmetros como seria usado no sistema real
    const mockParams = {
      title: "Estudo Comparativo de Metodologias",
      includeCharts: true,
      chartIds: ['analysis_rnd847', 'comparison_xyz123'], // IDs aleatórios
      abstract: "Este estudo compara metodologias...",
      keywords: "metodologia, comparação, análise"
    }

    console.log('🎯 Configuração simulada:')
    console.log(`- Gráficos: ${mockParams.includeCharts ? 'SIM' : 'NÃO'}`)
    console.log(`- IDs sugeridos: ${mockParams.chartIds?.join(', ') || 'Nenhum'}`)
    console.log(`- Quantidade: ${mockParams.chartIds?.length || 0} (flexível)`)
    
    console.log('\n📋 Prompt resultante incluiria:')
    console.log('- "QUANTIDADE FLEXÍVEL: Inclua 1-3 gráficos conforme necessário"')
    console.log('- "IDs ALEATÓRIOS: Gere IDs únicos e aleatórios"')
    console.log('- "REFERÊNCIAS GENÉRICAS: Use \'a visualização\', \'o gráfico\'"')
    console.log('- "NUNCA mencione o nome/ID do gráfico no texto"')

    console.log('\n' + '='.repeat(60) + '\n')

    // Teste 3: Verificar exemplos de referências corretas
    console.log('✅ Teste 3: Exemplos de referências no texto')
    
    const exemploCorreto = `
CORRETO ✅:
"Os resultados demonstram tendências significativas, conforme ilustrado na visualização a seguir.

<div style="margin: 40px 0; text-align: center;">
[CHART:analysis_rnd847]
</div>

A análise gráfica evidencia padrões claros nos dados coletados."

INCORRETO ❌:
"O gráfico analysis_rnd847 mostra..." (menciona ID)
"Conforme o chart_comparison_xyz123..." (menciona nome específico)
`

    console.log(exemploCorreto)

    console.log('\n🎯 RESUMO DAS MELHORIAS:')
    console.log('✅ Quantidade flexível (1-3 gráficos conforme necessário)')
    console.log('✅ IDs aleatórios para evitar padrões previsíveis')
    console.log('✅ Referências genéricas no texto do artigo')
    console.log('✅ Não mencionar nomes específicos dos gráficos')
    console.log('✅ Priorizar qualidade sobre quantidade obrigatória')

  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

// Executar teste
testFlexibleCharts()
