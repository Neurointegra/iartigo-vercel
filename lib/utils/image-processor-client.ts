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
  const cleanName = imageName.toLowerCase()
  
  // Estratégias de busca (em ordem de prioridade):
  
  // 1. Nome exato (removendo timestamp)
  let match = imageFiles.find(file => {
    const originalName = file.replace(/^\d+_/, '').toLowerCase()
    return originalName === cleanName
  })
  if (match) return match

  // 2. Nome contido no arquivo (removendo timestamp)
  match = imageFiles.find(file => {
    const originalName = file.replace(/^\d+_/, '').toLowerCase()
    return originalName.includes(cleanName.replace(/\.[^/.]+$/, ""))
  })
  if (match) return match

  // 3. Arquivo contém o nome procurado
  match = imageFiles.find(file => {
    return file.toLowerCase().includes(cleanName.replace(/\.[^/.]+$/, ""))
  })
  if (match) return match

  // 4. Busca mais flexível (sem extensão em ambos os lados)
  const nameWithoutExt = cleanName.replace(/\.[^/.]+$/, "")
  match = imageFiles.find(file => {
    const fileWithoutExt = file.replace(/^\d+_/, '').replace(/\.[^/.]+$/, "").toLowerCase()
    return fileWithoutExt === nameWithoutExt || 
           fileWithoutExt.includes(nameWithoutExt) ||
           nameWithoutExt.includes(fileWithoutExt)
  })
  
  return match
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

    console.log(`📸 Encontradas ${imageFiles.length} imagens disponíveis`)

    let processedContent = content
    const imageTagRegex = /\[Imagem:\s*([^\]]+)\]/g
    const matches = [...content.matchAll(imageTagRegex)]

    console.log(`🔍 Encontradas ${matches.length} tags de imagem no conteúdo`)

    for (const match of matches) {
      const [fullMatch, imageName] = match
      const cleanImageName = imageName.trim()

      const matchingFile = findMatchingImage(cleanImageName, imageFiles)

      if (matchingFile) {
        const imageUrl = `/uploads/${matchingFile}`
        const imageHtml = `
<div class="image-container" style="margin: 20px 0; text-align: center;">
  <img src="${imageUrl}" alt="${cleanImageName}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
  <p style="margin: 10px 0 0 0; font-style: italic; color: #666; font-size: 14px;">Figura: ${cleanImageName}</p>
</div>`
        
        processedContent = processedContent.replace(fullMatch, imageHtml)
        console.log(`✅ Imagem processada (client): ${cleanImageName} -> ${imageUrl}`)
      } else {
        console.log(`⚠️ Imagem não encontrada (client): ${cleanImageName}`)
        console.log(`   Arquivos disponíveis: ${imageFiles.join(', ')}`)
      }
    }

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
