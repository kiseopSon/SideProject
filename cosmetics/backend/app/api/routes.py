from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
import traceback
import logging
from app.services import ingredient_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["ingredients"])

class IngredientAnalysisRequest(BaseModel):
    ingredients: str  # 성분표 텍스트
    skin_type: str = "oily"  # oily, dry, sensitive, combination

class IngredientInfo(BaseModel):
    name: str
    effect: str
    purpose: str
    warning: Optional[str] = None

class ComprehensiveAnalysis(BaseModel):
    """종합 분석 결과"""
    suitability_score: int  # 적합성 점수 (0-100)
    primary_effects: List[str]  # 주요 효과들
    expected_results: str  # 예상되는 결과
    detailed_assessment: str  # 상세 평가
    recommendations: List[str]  # 추천사항
    warnings_summary: List[str]  # 주의사항 요약

class IngredientAnalysisResponse(BaseModel):
    analyzed_ingredients: List[IngredientInfo]
    skin_type_compatibility: str
    overall_assessment: str
    comprehensive_analysis: ComprehensiveAnalysis  # 종합 분석 결과

def get_ingredient_database() -> Dict:
    """성분 데이터베이스 가져오기 (캐싱 가능)"""
    return ingredient_db.get_all_ingredients()

def parse_ingredients(ingredient_text: str) -> List[str]:
    """성분표 텍스트를 파싱하여 개별 성분 리스트로 변환"""
    # 쉼표, 줄바꿈 등으로 구분된 성분을 분리
    separators = [',', '\n', ';', '|']
    ingredients = [ingredient_text]
    
    for sep in separators:
        new_ingredients = []
        for ing in ingredients:
            new_ingredients.extend([i.strip() for i in ing.split(sep) if i.strip()])
        ingredients = new_ingredients
    
    return ingredients

def assess_skin_compatibility(ingredients: List[IngredientInfo], skin_type: str) -> str:
    """피부 타입별 호환성을 평가"""
    if skin_type == "oily":
        # 지성 피부: 과도한 유분 제거 성분이 있는지 확인
        has_strong_cleanser = any("설페이트" in ing.name or "계면활성제" in ing.effect 
                                 for ing in ingredients)
        if has_strong_cleanser:
            return "지성 피부에 적합합니다. 강력한 세정 성분이 포함되어 있습니다."
        return "일반적으로 지성 피부에 적합합니다."
    
    return "분석 완료. 개인 피부 특성에 따라 반응이 다를 수 있습니다."

def generate_overall_assessment(ingredients: List[IngredientInfo], skin_type: str) -> str:
    """전체적인 평가 생성"""
    warnings = [ing.warning for ing in ingredients if ing.warning]
    
    if warnings:
        return f"총 {len(ingredients)}개의 성분 중 {len(warnings)}개의 주의 성분이 발견되었습니다. 사용 전 패치 테스트를 권장합니다."
    
    return f"총 {len(ingredients)}개의 성분을 분석했습니다. 특별한 주의 사항은 없습니다."

def generate_comprehensive_analysis(
    ingredients: List[IngredientInfo], 
    skin_type: str
) -> ComprehensiveAnalysis:
    """종합 분석 결과 생성"""
    
    # 점수 계산 (0-100)
    base_score = 70
    
    # 성분 효과 분석
    effects_map = {
        "계면활성제": "깊은 세정",
        "보습제": "수분 공급",
        "추출물": "자연 성분 혜택",
        "용제": "기본 용매",
        "합성 색소": "색상 조정",
        "용매": "성분 용해"
    }
    
    primary_effects = []
    effect_counts = {}
    
    for ing in ingredients:
        effect = ing.effect
        if effect in effects_map:
            primary_effects.append(effects_map[effect])
            effect_counts[effect] = effect_counts.get(effect, 0) + 1
        elif effect not in ["알 수 없음"]:
            primary_effects.append(effect)
    
    # 중복 제거
    primary_effects = list(set(primary_effects))
    
    # 피부 타입별 점수 조정
    warnings_count = len([ing for ing in ingredients if ing.warning])
    
    if skin_type == "oily":
        # 지성 피부: 세정 성분이 있으면 가산점
        has_cleanser = any("계면활성제" in ing.effect or "설페이트" in ing.name 
                          for ing in ingredients)
        if has_cleanser:
            base_score += 15
        else:
            base_score -= 10
        
        # 보습 성분이 적당히 있으면 좋음
        has_moisturizer = any("보습" in ing.effect or "글리세린" in ing.name 
                             for ing in ingredients)
        if has_moisturizer:
            base_score += 5
        
    elif skin_type == "dry":
        # 건성 피부: 보습 성분이 중요
        has_moisturizer = any("보습" in ing.effect or "글리세린" in ing.name 
                             for ing in ingredients)
        if has_moisturizer:
            base_score += 15
        
        # 강한 세정 성분이 있으면 감점
        has_strong_cleanser = any("설페이트" in ing.name 
                                 for ing in ingredients)
        if has_strong_cleanser:
            base_score -= 15
    
    elif skin_type == "sensitive":
        # 민감성 피부: 주의 성분이 있으면 감점
        base_score -= warnings_count * 10
        if warnings_count == 0:
            base_score += 10
    
    # 알 수 없는 성분이 많으면 감점
    unknown_count = len([ing for ing in ingredients if ing.effect == "알 수 없음"])
    base_score -= unknown_count * 5
    
    # 경고가 있으면 감점
    base_score -= warnings_count * 8
    
    # 점수 범위 조정 (0-100)
    suitability_score = max(0, min(100, base_score))
    
    # 예상 결과 생성
    expected_results = generate_expected_results(ingredients, skin_type)
    
    # 상세 평가
    detailed_assessment = generate_detailed_assessment(ingredients, skin_type, suitability_score)
    
    # 추천사항
    recommendations = generate_recommendations(ingredients, skin_type, suitability_score)
    
    # 주의사항 요약
    warnings_summary = [ing.warning for ing in ingredients if ing.warning]
    
    return ComprehensiveAnalysis(
        suitability_score=suitability_score,
        primary_effects=primary_effects if primary_effects else ["기본 제품"],
        expected_results=expected_results,
        detailed_assessment=detailed_assessment,
        recommendations=recommendations,
        warnings_summary=warnings_summary
    )

def generate_expected_results(ingredients: List[IngredientInfo], skin_type: str) -> str:
    """예상되는 결과 설명"""
    has_cleanser = any("계면활성제" in ing.effect or "설페이트" in ing.name 
                      for ing in ingredients)
    has_moisturizer = any("보습" in ing.effect or "글리세린" in ing.name 
                         for ing in ingredients)
    has_extract = any("추출물" in ing.effect for ing in ingredients)
    
    results = []
    
    if skin_type == "oily":
        if has_cleanser:
            results.append("유분과 노폐물을 깊이 세정하여 깨끗한 피부를 유지할 수 있습니다.")
        if has_moisturizer:
            results.append("세정 후에도 적당한 수분 공급으로 피부 밸런스를 유지합니다.")
        if has_extract:
            results.append("자연 성분으로 추가적인 피부 개선 효과를 기대할 수 있습니다.")
        if not has_cleanser:
            results.append("지성 피부에는 세정력이 부족할 수 있습니다.")
    
    elif skin_type == "dry":
        if has_moisturizer:
            results.append("수분을 충분히 공급하여 건조함을 완화할 수 있습니다.")
        if has_cleanser:
            results.append("강한 세정 성분으로 인해 건조함이 심해질 수 있어 주의가 필요합니다.")
        if not has_moisturizer:
            results.append("보습 성분이 부족하여 추가 보습 관리가 필요할 수 있습니다.")
    
    elif skin_type == "sensitive":
        warnings_count = len([ing for ing in ingredients if ing.warning])
        if warnings_count > 0:
            results.append("주의 성분이 포함되어 있어 민감한 피부에는 부적합할 수 있습니다.")
        else:
            results.append("자극이 적은 성분들로 구성되어 있어 민감한 피부에도 비교적 안전합니다.")
    
    if not results:
        results.append("성분 조합에 따라 피부에 따라 다양한 반응을 보일 수 있습니다.")
    
    return " ".join(results)

def generate_detailed_assessment(
    ingredients: List[IngredientInfo], 
    skin_type: str, 
    score: int
) -> str:
    """상세 평가 생성"""
    skin_type_kr = {"oily": "지성", "dry": "건성", "sensitive": "민감성", "combination": "복합성"}[skin_type]
    
    assessment_parts = []
    
    if score >= 80:
        assessment_parts.append(f"이 제품은 {skin_type_kr} 피부에 매우 적합합니다.")
    elif score >= 60:
        assessment_parts.append(f"이 제품은 {skin_type_kr} 피부에 일반적으로 적합합니다.")
    elif score >= 40:
        assessment_parts.append(f"이 제품은 {skin_type_kr} 피부에 다소 부적합할 수 있습니다.")
    else:
        assessment_parts.append(f"이 제품은 {skin_type_kr} 피부에 권장되지 않습니다.")
    
    # 성분 구성 평가
    cleanser_count = len([ing for ing in ingredients 
                         if "계면활성제" in ing.effect or "설페이트" in ing.name])
    moisturizer_count = len([ing for ing in ingredients 
                            if "보습" in ing.effect])
    
    if cleanser_count > 0:
        assessment_parts.append(f"{cleanser_count}개의 세정 성분이 포함되어 있어 깊은 세정이 가능합니다.")
    
    if moisturizer_count > 0:
        assessment_parts.append(f"{moisturizer_count}개의 보습 성분이 포함되어 있어 수분 공급에 도움이 됩니다.")
    
    warnings_count = len([ing for ing in ingredients if ing.warning])
    if warnings_count > 0:
        assessment_parts.append(f"총 {warnings_count}개의 주의 성분이 포함되어 있어 사용 전 테스트를 권장합니다.")
    
    return " ".join(assessment_parts)

def generate_recommendations(
    ingredients: List[IngredientInfo], 
    skin_type: str, 
    score: int
) -> List[str]:
    """추천사항 생성"""
    recommendations = []
    
    has_strong_cleanser = any("설페이트" in ing.name for ing in ingredients)
    has_moisturizer = any("보습" in ing.effect or "글리세린" in ing.name 
                         for ing in ingredients)
    warnings_count = len([ing for ing in ingredients if ing.warning])
    
    if skin_type == "oily":
        if not has_strong_cleanser:
            recommendations.append("지성 피부에는 세정력이 강한 성분이 포함된 제품을 선택하는 것이 좋습니다.")
        if has_strong_cleanser:
            recommendations.append("세정 후 보습제를 함께 사용하여 피부 밸런스를 유지하세요.")
        if warnings_count > 0:
            recommendations.append("주의 성분이 포함되어 있으므로 사용 전 소량으로 테스트해보세요.")
    
    elif skin_type == "dry":
        if not has_moisturizer:
            recommendations.append("건성 피부에는 보습 성분이 풍부한 제품을 추가로 사용하세요.")
        if has_strong_cleanser:
            recommendations.append("강한 세정 성분이 포함되어 있어 건조함이 심해질 수 있으니 보습 관리에 신경 쓰세요.")
    
    elif skin_type == "sensitive":
        if warnings_count > 0:
            recommendations.append("민감한 피부에는 주의 성분이 없는 제품을 선택하는 것이 좋습니다.")
        recommendations.append("사용 전 패치 테스트를 반드시 진행하세요.")
        recommendations.append("처음에는 소량만 사용하고 피부 반응을 확인하세요.")
    
    if score < 60:
        recommendations.append("피부 타입에 맞지 않을 수 있으니 사용 시 주의가 필요합니다.")
    
    if not recommendations:
        recommendations.append("일반적인 사용법에 따라 사용하시면 됩니다.")
    
    return recommendations

def analyze_ingredient(ingredient_name: str) -> IngredientInfo:
    """단일 성분을 분석하여 정보를 반환"""
    ingredient_database = get_ingredient_database()
    
    # 데이터베이스에서 찾기 (대소문자 무시, 공백 제거, 부분 일치)
    ingredient_clean = ingredient_name.strip()
    ingredient_lower = ingredient_clean.lower()
    ingredient_no_space = ingredient_clean.replace(" ", "").replace("-", "")
    
    # 정확한 일치 확인 (공백 포함)
    if ingredient_clean in ingredient_database:
        info = ingredient_database[ingredient_clean]
        return IngredientInfo(
            name=ingredient_clean,
            effect=info["effect"],
            purpose=info["purpose"],
            warning=info.get("warning")
        )
    
    # 공백 제거 후 정확한 일치 확인
    for db_name, info in ingredient_database.items():
        db_no_space = db_name.replace(" ", "").replace("-", "")
        if db_no_space == ingredient_no_space and len(ingredient_no_space) > 2:
            return IngredientInfo(
                name=ingredient_clean,
                effect=info["effect"],
                purpose=info["purpose"],
                warning=info.get("warning")
            )
    
    # 부분 일치 확인 (더 정확한 매칭)
    for db_name, info in ingredient_database.items():
        db_lower = db_name.lower().replace(" ", "").replace("-", "")
        ingredient_lower_no_space = ingredient_lower.replace(" ", "").replace("-", "")
        
        # 양방향 부분 일치 확인 (공백 제거 후)
        if (db_lower in ingredient_lower_no_space or ingredient_lower_no_space in db_lower) and len(db_lower) > 3:
            return IngredientInfo(
                name=ingredient_clean,
                effect=info["effect"],
                purpose=info["purpose"],
                warning=info.get("warning")
            )
    
    # 데이터베이스에 없는 경우
    return IngredientInfo(
        name=ingredient_clean,
        effect="알 수 없음",
        purpose="데이터베이스에 해당 성분 정보가 없습니다",
        warning="추가 검증이 필요할 수 있습니다"
    )

@router.post("/analyze", response_model=IngredientAnalysisResponse)
async def analyze_ingredients(request: IngredientAnalysisRequest):
    """
    화장품 성분표를 분석합니다.
    
    - **ingredients**: 성분표 텍스트 (쉼표 또는 줄바꿈으로 구분)
    - **skin_type**: 피부 타입 (oily, dry, sensitive, combination)
    """
    try:
        # 성분 파싱
        ingredient_list = parse_ingredients(request.ingredients)
        
        if not ingredient_list:
            raise HTTPException(status_code=400, detail="성분표가 비어있습니다")
        
        # 각 성분 분석
        analyzed = [analyze_ingredient(ing) for ing in ingredient_list]
        
        # 피부 타입별 호환성 평가
        skin_type_compatibility = assess_skin_compatibility(analyzed, request.skin_type)
        
        # 전체 평가
        overall_assessment = generate_overall_assessment(analyzed, request.skin_type)
        
        # 종합 분석
        comprehensive = generate_comprehensive_analysis(analyzed, request.skin_type)
        
        return IngredientAnalysisResponse(
            analyzed_ingredients=analyzed,
            skin_type_compatibility=skin_type_compatibility,
            overall_assessment=overall_assessment,
            comprehensive_analysis=comprehensive
        )
    
    except HTTPException:
        raise
    except Exception as e:
        error_trace = traceback.format_exc()
        logger.error(f"분석 중 오류 발생: {str(e)}\n{error_trace}")
        print(f"ERROR: {str(e)}")
        print(error_trace)
        raise HTTPException(status_code=500, detail=f"분석 중 오류가 발생했습니다: {str(e)}")

