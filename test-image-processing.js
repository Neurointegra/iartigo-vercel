const fs = require('fs');
const path = require('path');

// Função melhorada de busca
function findMatchingImage(imageName, imageFiles) {
  const cleanName = imageName.toLowerCase().trim()
  
  console.log(`🔍 Procurando por: "${cleanName}"`)
  
  // 1. Nome exato (ignorando timestamp)
  let match = imageFiles.find(file => {
    const originalName = file.replace(/^\d+_/, '').toLowerCase()
    const isExactMatch = originalName === cleanName
    if (isExactMatch) console.log(`✅ Match exato: ${file}`)
    return isExactMatch
  })
  if (match) return match

  // 2. Nome sem underscores e hífens
  const normalizedSearchName = cleanName.replace(/[_-]/g, '').replace(/\.[^/.]+$/, "")
  match = imageFiles.find(file => {
    const originalName = file.replace(/^\d+_/, '').toLowerCase()
    const normalizedFileName = originalName.replace(/[_-]/g, '').replace(/\.[^/.]+$/, "")
    const isNormalizedMatch = normalizedFileName.includes(normalizedSearchName) || normalizedSearchName.includes(normalizedFileName)
    if (isNormalizedMatch) console.log(`✅ Match normalizado: ${file}`)
    return isNormalizedMatch
  })
  if (match) return match

  // 3. Busca por partes do nome (palavras-chave)
  const searchWords = cleanName.replace(/\.[^/.]+$/, "").split(/[_-]/).filter(word => word.length > 2)
  match = imageFiles.find(file => {
    const originalName = file.replace(/^\d+_/, '').toLowerCase()
    const hasAllWords = searchWords.every(word => originalName.includes(word))
    if (hasAllWords) console.log(`✅ Match por palavras: ${file} (palavras: ${searchWords.join(', ')})`)
    return hasAllWords
  })
  if (match) return match

  console.log(`❌ Nenhuma correspondência encontrada para: ${cleanName}`)
  return undefined
}

// Simular o processamento de imagens
async function testImageProcessing() {
  console.log('🧪 Testando processamento de imagens melhorado...');
  
  // Verificar pasta uploads
  const uploadsPath = path.join(__dirname, 'public', 'uploads');
  
  if (!fs.existsSync(uploadsPath)) {
    console.log('❌ Pasta uploads não encontrada');
    return;
  }
  
  const files = fs.readdirSync(uploadsPath);
  const imageFiles = files.filter(file => 
    file.match(/\.(jpg|jpeg|png|gif|webp)$/i) && !file.startsWith('.')
  );
  
  console.log(`📸 Encontradas ${imageFiles.length} imagens:`);
  imageFiles.forEach(file => {
    console.log(`  - ${file}`);
  });
  
  // Testar vários casos
  const testCases = [
    'imagem2025-08-03_201214318.png',
    'imagem_2025-08-03_201214318.png', 
    'imagem202508032012.png',
    'logo.png',
    'image-removebg-preview.png'
  ];

  console.log('\n🧪 Testando diferentes casos de busca:');
  testCases.forEach((testName, index) => {
    console.log(`\n${index + 1}. Testando: "${testName}"`);
    const result = findMatchingImage(testName, imageFiles);
    if (result) {
      console.log(`   ✅ Resultado: ${result}`);
    } else {
      console.log(`   ❌ Não encontrado`);
    }
  });
}

testImageProcessing().catch(console.error);
