"use client"

import { useEffect } from "react"

interface HotmartCheckoutWidgetProps {
  productUrl: string
  buttonText?: string
  className?: string
  customButton?: boolean
}

export function HotmartCheckoutWidget({
  productUrl,
  buttonText = "Assinar Agora",
  className = "",
  customButton = true,
}: HotmartCheckoutWidgetProps) {
  useEffect(() => {
    // Função para importar scripts da Hotmart
    function importHotmart() {
      // Verificar se já foi carregado
      if (document.querySelector('script[src*="hotmart.com/checkout/widget.min.js"]')) {
        return
      }

      // Importar JavaScript
      const script = document.createElement("script")
      script.src = "https://static.hotmart.com/checkout/widget.min.js"
      script.type = "text/javascript"
      document.head.appendChild(script)

      // Importar CSS
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.type = "text/css"
      link.href = "https://static.hotmart.com/css/hotmart-fb.min.css"
      document.head.appendChild(link)
    }

    importHotmart()
  }, [])

  if (customButton) {
    return (
      <a
        onClick={() => false}
        href={`${productUrl}?checkoutMode=2`}
        className={`hotmart-fb hotmart__button-checkout inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-green-600 text-white hover:bg-green-700 h-12 px-8 py-3 w-full text-lg ${className}`}
      >
        {buttonText}
      </a>
    )
  }

  // Botão padrão da Hotmart
  return (
    <a onClick={() => false} href={`${productUrl}?checkoutMode=2`} className="hotmart-fb hotmart__button-checkout">
      <img src="https://static.hotmart.com/img/btn-buy-green.png" alt={buttonText} />
    </a>
  )
}
