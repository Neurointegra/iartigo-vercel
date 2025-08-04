/**
 * Script de teste para verificar a geração de imagens com Gemini AI
 */

import { processChartTags } from './lib/utils/chart-processor-ai.js'

async function testChartGeneration() {
  console.log('🧪 Iniciando teste de geração de gráficos com Gemini AI...')
  
  // Conteúdo de teste com tags de gráficos
  const testContent = `
# Artigo de Teste - IA Generativa

## Introdução
Este é um artigo de teste para verificar a geração de gráficos.

## Resultados

Aqui temos um gráfico de barras:
[CHART: resultados_comparativo]

E aqui um gráfico de linha temporal:
[CHART: evolucao_temporal]

## Conclusão
Os gráficos foram processados com sucesso.
`

  const context = {
    title: 'IA Generativa em Pesquisa Acadêmica',
    fieldOfStudy: 'Ciência da Computação'
  }

  try {
    console.log('📝 Processando conteúdo de teste...')
    const processedContent = await processChartTags(testContent, context)
    
    console.log('\n✅ RESULTADO:')
    console.log('=====================================')
    console.log(processedContent)
    console.log('=====================================')
    
    // Verificar se as tags foram substituídas
    const hasChartTags = processedContent.includes('[CHART:')
    const hasImageTags = processedContent.includes('[Imagem:')
    
    console.log(`\n📊 ANÁLISE:`)
    console.log(`- Tags [CHART:] restantes: ${hasChartTags ? '❌ SIM' : '✅ NÃO'}`)
    console.log(`- Tags [Imagem:] criadas: ${hasImageTags ? '✅ SIM' : '❌ NÃO'}`)
    
    if (!hasChartTags && hasImageTags) {
      console.log('\n🎉 Teste bem-sucedido! Gráficos processados corretamente.')
    } else {
      console.log('\n⚠️ Teste parcialmente bem-sucedido. Verificar implementação.')
    }
    
  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error)
  }
}

// Executar teste
testChartGeneration().catch(console.error)
