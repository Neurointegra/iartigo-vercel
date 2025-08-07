'use client'

import { useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Filler
} from 'chart.js'

// Registrar todos os componentes necessários do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Filler
)

export function ChartProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Disponibilizar Chart globalmente para scripts dinâmicos
    if (typeof window !== 'undefined') {
      (window as any).Chart = ChartJS
    }
  }, [])

  return <>{children}</>
}
