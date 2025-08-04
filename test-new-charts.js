const testNewChartSystem = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/process-charts-new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dataFiles: [
          {
            fileName: 'vendas.csv',
            content: 'Mes,Vendas,Meta\nJan,100,90\nFev,150,120\nMar,120,100\nAbr,180,140\nMai,200,160',
            type: 'data',
            size: '200B'
          }
        ],
        content: 'Análise das vendas [CHART:vendas_trimestre] mostra crescimento consistente.',
        context: 'Relatório comercial'
      })
    })
    
    const result = await response.json()
    console.log('🧪 Resultado do teste:', JSON.stringify(result, null, 2))
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  }
}

// Executar teste
testNewChartSystem()
