/**
 * Teste simples do processador de gráficos
 */

console.log('🧪 Teste simples de gráficos com IA...')

// Simular o processamento sem importar módulos complexos
const testContent = `
# Artigo de Teste

## Metodologia

Este estudo segue uma abordagem quantitativa:

<div style="margin: 40px 0; text-align: center;">
[CHART:metodologia_fluxo]
</div>

## Resultados

Os dados coletados apresentam variações:

<div style="margin: 40px 0; text-align: center;">
[CHART:resultados_comparativo]
</div>
`

console.log('📝 Conteúdo original:')
console.log(testContent)

// Verificar se encontra as tags
const chartTagRegex = /\[CHART:([^\]]+)\]/gi
const matches = testContent.match(chartTagRegex)

if (matches) {
  console.log(`\n📊 Encontradas ${matches.length} tags [CHART:]:`)
  matches.forEach((match, index) => {
    const chartId = match.replace(/\[CHART:([^\]]+)\]/, '$1').trim()
    console.log(`  ${index + 1}. ${match} → ID: ${chartId}`)
  })
} else {
  console.log('\n❌ Nenhuma tag [CHART:] encontrada')
}

console.log('\n✅ Teste de detecção de tags concluído!')
