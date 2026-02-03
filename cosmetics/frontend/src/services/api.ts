import axios from 'axios'
import type { IngredientAnalysisResponse } from '../types'

const API_BASE_URL = 'http://localhost:8000'

export const analyzeIngredients = async (
  ingredients: string,
  skinType: string = 'oily'
): Promise<IngredientAnalysisResponse> => {
  const response = await axios.post<IngredientAnalysisResponse>(
    `${API_BASE_URL}/api/analyze`,
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
    `${API_BASE_URL}/api/admin/scrape/from-analysis`,
    {
      ingredient_names: ingredientNames,
      delay: delay,
    }
  )
  return response.data
}

