export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    // Usar UTC para garantir consistência entre servidor e cliente
    const day = date.getUTCDate().toString().padStart(2, '0')
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0')
    const year = date.getUTCFullYear()
    
    return `${day}/${month}/${year}`
  } catch (error) {
    return 'Data inválida'
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    const day = date.getUTCDate().toString().padStart(2, '0')
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0')
    const year = date.getUTCFullYear()
    const hours = date.getUTCHours().toString().padStart(2, '0')
    const minutes = date.getUTCMinutes().toString().padStart(2, '0')
    
    return `${day}/${month}/${year} ${hours}:${minutes}`
  } catch (error) {
    return 'Data inválida'
  }
}
