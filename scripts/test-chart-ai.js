/**
 * Teste do sistema de gráficos com IA
 */

import { processChartTags } from '../lib/utils/chart-processor-ai'

async function testChartGeneration() {
  console.log('🧪 Testando geração de gráficos com IA...')
  
  // Conteúdo de teste com tags [CHART:]
  const testContent = `
# Artigo de Teste

## Metodologia

Este estudo segue uma abordagem quantitativa, conforme apresentado no fluxograma a seguir:

<div style="margin: 40px 0; text-align: center;">
[CHART:metodologia_fluxo]
</div>

O processo metodológico demonstra as etapas principais da pesquisa.

## Resultados

Os dados coletados apresentam variações significativas, como evidenciado no gráfico comparativo:

<div style="margin: 40px 0; text-align: center;">
[CHART:resultados_comparativo]
</div>

A análise dos resultados revela tendências importantes para o estudo.

## Discussão

A distribuição dos dados permite uma análise aprofundada, conforme o gráfico de dispersão:

<div style="margin: 40px 0; text-align: center;">
[CHART:analise_dados]
</div>

Os resultados contribuem para o avanço do conhecimento na área.
`

  const context = {
    title: 'Estudo sobre Inovação Tecnológica',
    fieldOfStudy: 'Ciência da Computação'
  }

  try {
    console.log('📝 Conteúdo original:')
    console.log(testContent)
    
    console.log('\n🔄 Processando tags [CHART:]...')
    const processedContent = await processChartTags(testContent, context)
    
    console.log('\n✅ Conteúdo processado:')
    console.log(processedContent)
    
    console.log('\n🎉 Teste concluído com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  }
}

// Executar o teste se for chamado diretamente
if (require.main === module) {
  testChartGeneration()
}

export { testChartGeneration }
