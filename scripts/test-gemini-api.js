/**
 * Teste da API do Gemini
 */

const { GoogleGenerativeAI } = require('@google/generative-ai')

async function testGeminiAPI() {
  console.log('🧪 Testando API do Gemini...')
  
  // Verificar se a API key está configurada
  if (!process.env.GEMINI_API_KEY) {
    console.log('❌ API key GEMINI_API_KEY não encontrada no processo.env')
    console.log('📋 Variáveis disponíveis:')
    Object.keys(process.env).filter(key => key.includes('GEMINI')).forEach(key => {
      console.log(`   ${key}: ${process.env[key] ? 'Configurada' : 'Vazia'}`)
    })
    return
  }
  
  console.log('✅ API key encontrada')
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
    
    console.log('🔄 Testando conexão com Gemini...')
    
    const result = await model.generateContent([
      'Responda apenas com "API FUNCIONANDO" se você conseguir processar esta mensagem.'
    ])
    
    const response = result.response.text()
    console.log('📨 Resposta da API:', response)
    
    if (response.includes('API FUNCIONANDO') || response.includes('funcionando')) {
      console.log('🎉 API do Gemini está funcionando corretamente!')
    } else {
      console.log('⚠️ API respondeu, mas resposta inesperada')
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message)
  }
}

testGeminiAPI()
