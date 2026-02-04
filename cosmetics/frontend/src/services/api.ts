import axios from 'axios'
import type { IngredientAnalysisResponse } from '../types'

// EAI Hub 프록시 경유 시(/api/cosmetics) → /api/cosmetics-api, 로컬 개발 시 → localhost:8500
const isProxy = typeof window !== 'undefined' && window.location.pathname.startsWith('/api/cosmetics')
const API_BASE = isProxy ? '/api/cosmetics-api' : 'http://localhost:8500/api'

export const analyzeIngredients = async (
  ingredients: string,
  skinType: string = 'oily'
): Promise<IngredientAnalysisResponse> => {
  const response = await axios.post<IngredientAnalysisResponse>(
    `${API_BASE}/analyze`,
    {
      ingredients,
      skin_type: skinType,
    }
  )
  return response.data
}

export interface ScrapeResponse {
  message: string
  results: {
    success: string[]
    failed: string[]
    skipped: string[]
  }
}

export const scrapeIngredients = async (
  ingredientNames: string[],
  delay: number = 1.0
): Promise<ScrapeResponse> => {
  const response = await axios.post<ScrapeResponse>(
    `${API_BASE}/admin/scrape/from-analysis`,
    {
      ingredient_names: ingredientNames,
      delay: delay,
    }
  )
  return response.data
}

