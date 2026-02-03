export interface IngredientInfo {
  name: string
  effect: string
  purpose: string
  warning: string | null
}

export interface ComprehensiveAnalysis {
  suitability_score: number
  primary_effects: string[]
  expected_results: string
  detailed_assessment: string
  recommendations: string[]
  warnings_summary: string[]
}

export interface IngredientAnalysisResponse {
  analyzed_ingredients: IngredientInfo[]
  skin_type_compatibility: string
  overall_assessment: string
  comprehensive_analysis: ComprehensiveAnalysis
}

