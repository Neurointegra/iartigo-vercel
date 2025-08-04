/**
 * Utilitário para processar tags de imagem no frontend
 */

// Cache para armazenar a lista de imagens disponíveis
let imageCache: string[] = []

/**
 * Busca lista de imagens disponíveis na pasta uploads
 */
async function fetchAvailableImages(): Promise<string[]> {
  try {
    if (imageCache.length > 0) {
      return imageCache
    }

    const response = await fetch('/api/list-images')
    if (response.ok) {
      const data = await response.json()
      imageCache = data.images.map((img: any) => img.filename)
      return imageCache
    }
  } catch (error) {
    console.error('Erro ao buscar imagens:', error)
  }
  
  return []
}

/**
 * Encontra uma imagem correspondente na lista de arquivos
 */
function findMatchingImage(imageName: string, imageFiles: string[]): string | undefined {
  const cleanName = imageName.toLowerCase().trim()
  
  console.log(`🔍 Procurando por: "${cleanName}"`)
  console.log(`📁 Arquivos disponíveis: ${imageFiles.join(', ')}`)
  
  // Estratégias de busca (em ordem de prioridade):
  
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

  // 4. Busca flexível - qualquer parte significativa
  const significantPart = cleanName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, '').substring(0, 10)
  if (significantPart.length >= 4) {
    match = imageFiles.find(file => {
      const originalName = file.replace(/^\d+_/, '').toLowerCase().replace(/[_-]/g, '')
      const hasSignificantPart = originalName.includes(significantPart) || significantPart.includes(originalName.substring(0, 10))
      if (hasSignificantPart) console.log(`✅ Match flexível: ${file} (parte: ${significantPart})`)
      return hasSignificantPart
    })
    if (match) return match
  }

  // 5. Fallback - primeira imagem se só houver uma
  if (imageFiles.length === 1) {
    console.log(`🎯 Usando única imagem disponível: ${imageFiles[0]}`)
    return imageFiles[0]
  }

  console.log(`❌ Nenhuma correspondência encontrada para: ${cleanName}`)
  return undefined
}

/**
 * Processa tags [Imagem: nome] no conteúdo e as substitui por HTML
 */
export async function processImageTagsClient(content: string): Promise<string> {
  try {
    const imageFiles = await fetchAvailableImages()
    
    if (imageFiles.length === 0) {
      console.log('📁 Nenhuma imagem encontrada na pasta uploads')
      return content
    }

    console.log(`📸 Encontradas ${imageFiles.length} imagens disponíveis:`)
    imageFiles.forEach(file => console.log(`  - ${file}`))

    let processedContent = content
    const imageTagRegex = /\[Imagem:\s*([^\]]+)\]/g
    const matches = [...content.matchAll(imageTagRegex)]

    console.log(`🔍 Encontradas ${matches.length} tags de imagem no conteúdo`)

    for (const match of matches) {
      const [fullMatch, imageName] = match
      const cleanImageName = imageName.trim()

      console.log(`\n🔄 Processando: "${cleanImageName}"`)
      const matchingFile = findMatchingImage(cleanImageName, imageFiles)

      if (matchingFile) {
        const imageUrl = `/uploads/${matchingFile}`
        const imageHtml = `
<div class="image-container" style="margin: 30px 0; text-align: center;">
  <img 
    src="${imageUrl}" 
    alt="${cleanImageName}" 
    style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: block; margin: 0 auto;" 
    onload="console.log('✅ Imagem carregada:', '${imageUrl}')"
    onerror="console.error('❌ Erro ao carregar imagem:', '${imageUrl}')"
  />
  <p style="margin: 10px 0 0 0; font-style: italic; color: #666; font-size: 14px;">
    Figura: ${cleanImageName}
  </p>
</div>`
        
        processedContent = processedContent.replace(fullMatch, imageHtml)
        console.log(`✅ Imagem processada: "${cleanImageName}" -> ${imageUrl}`)
      } else {
        console.log(`⚠️ Imagem não encontrada: "${cleanImageName}"`)
        // Manter a tag original para debug
        const placeholderHtml = `
<div class="image-placeholder" style="margin: 30px 0; text-align: center; padding: 20px; border: 2px dashed #ccc; background: #f9f9f9;">
  <p style="color: #666; font-style: italic;">
    ❌ Imagem não encontrada: "${cleanImageName}"
  </p>
  <p style="color: #999; font-size: 12px;">
    Arquivos disponíveis: ${imageFiles.join(', ')}
  </p>
</div>`
        
        processedContent = processedContent.replace(fullMatch, placeholderHtml)
      }
    }

    console.log(`🎯 Processamento concluído. ${matches.length} tags processadas.`)
    return processedContent
  } catch (error) {
    console.error('❌ Erro ao processar tags de imagem (client):', error)
    return content
  }
}

/**
 * Limpa o cache de imagens
 */
export function clearImageCache() {
  imageCache = []
}
