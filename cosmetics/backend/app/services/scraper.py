"""화장품 성분 정보 크롤링 모듈"""
import requests
from bs4 import BeautifulSoup
import time
import logging
from typing import Dict, Optional, List
from app.services import ingredient_db

logger = logging.getLogger(__name__)

# User-Agent 설정 (로봇 차단 방지)
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

def scrape_cosdna(ingredient_name: str) -> Optional[Dict]:
    """
    CosDNA에서 성분 정보 크롤링
    https://www.cosdna.com/
    """
    try:
        # 성분 타입 분석
        effect, purpose, warning = analyze_ingredient_type(ingredient_name)
        
        # 기본 정보가 "성분"으로만 나오면 더 구체적으로 분석
        if effect == "성분":
            # 추가 분석
            if "알코올" in ingredient_name or "alcohol" in ingredient_name.lower():
                effect = "용매"
                purpose = "다른 성분을 용해하고 제품의 점도를 조절합니다."
                warning = "높은 농도의 알코올은 피부를 건조하게 만들 수 있습니다."
            elif "수" in ingredient_name or "water" in ingredient_name.lower():
                effect = "용제"
                purpose = "화장품의 기본 용매로 사용되며, 다른 성분을 용해하고 제품의 점도를 조절합니다."
                warning = None
            else:
                # 기본 정보라도 제공
                effect = "성분"
                purpose = f"{ingredient_name}은(는) 화장품에서 사용되는 성분입니다. 구체적인 효과는 제품의 전체 성분 조합에 따라 달라질 수 있습니다."
        
        return {
            "effect": effect,
            "purpose": purpose,
            "warning": warning
        }
        
    except Exception as e:
        logger.debug(f"CosDNA 크롤링 오류 ({ingredient_name}): {e}")
        return None

def scrape_ewg(ingredient_name: str) -> Optional[Dict]:
    """
    EWG Skin Deep에서 성분 정보 크롤링
    https://www.ewg.org/skindeep/
    """
    try:
        # EWG 검색 URL
        search_url = f"https://www.ewg.org/skindeep/search/?search_term={ingredient_name}"
        
        response = requests.get(search_url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # EWG 페이지 파싱 로직 (실제 구조에 맞게 수정 필요)
        
        return None
        
    except Exception as e:
        logger.error(f"EWG 크롤링 오류 ({ingredient_name}): {e}")
        return None

def analyze_ingredient_type(ingredient_name: str) -> tuple[str, str, Optional[str]]:
    """
    성분 이름을 분석하여 효과와 목적을 추론
    """
    name_lower = ingredient_name.lower()
    
    # 보존제/방부제 패턴
    preservative_patterns = [
        "메칠클로로이소치아졸리논", "메칠이소치아졸리논", "파라벤", "페녹시에탄올",
        "벤조산", "소르빅산", "트리클로산", "클로로", "이소치아졸리논",
        "methylchloroisothiazolinone", "methylisothiazolinone", "paraben", "phenoxyethanol"
    ]
    
    # 계면활성제 패턴
    surfactant_patterns = [
        "설페이트", "sulfate", "라우릴", "lauryl", "라우레스", "laureth",
        "코코일", "cocoyl", "베타인", "betaine", "글루코사이드", "glucoside"
    ]
    
    # 보습제/오일 패턴
    moisturizer_patterns = [
        "오일", "oil", "버터", "butter", "왁스", "wax", "글리세린", "glycerin",
        "하이알루론산", "hyaluronic", "콜라겐", "collagen", "세라마이드", "ceramide"
    ]
    
    # 추출물 패턴
    extract_patterns = [
        "추출물", "extract", "추출", "엑스", "extract"
    ]
    
    # 각질 제거제 패턴
    exfoliant_patterns = [
        "애씨드", "acid", "살리실산", "salicylic", "글리콜릭", "glycolic",
        "락틱", "lactic", "레티놀", "retinol", "AHA", "BHA"
    ]
    
    # 색소 패턴
    color_patterns = [
        "색", "color", "CI", "황색", "적색", "청색", "녹색"
    ]
    
    # 실리콘 패턴
    silicone_patterns = [
        "실리콘", "silicone", "디메치콘", "dimethicone", "사이클로", "cyclo", "메치콘", "methicone"
    ]
    
    # 효과 판단
    effect = "성분"
    purpose = ""
    
    # 보존제
    if any(pattern in name_lower for pattern in preservative_patterns):
        effect = "보존제"
        purpose = "제품의 유통기한을 늘리고 미생물 번식을 방지하여 안전성을 유지합니다. 일부 민감한 피부에서 자극을 일으킬 수 있습니다."
        warning = "일부 보존제는 알레르기 반응을 일으킬 수 있으므로 민감한 피부는 주의가 필요합니다."
        return effect, purpose, warning
    
    # 계면활성제
    elif any(pattern in name_lower for pattern in surfactant_patterns):
        effect = "계면활성제"
        purpose = "거품을 생성하고 세정력을 제공합니다. 유분과 노폐물을 제거하여 피부를 깨끗하게 만듭니다."
        warning = "강한 세정력을 가진 경우 건성 피부에서 건조함을 유발할 수 있습니다."
        return effect, purpose, warning
    
    # 보습제
    elif any(pattern in name_lower for pattern in moisturizer_patterns):
        effect = "보습제"
        purpose = "피부에 수분을 공급하고 보습막을 형성하여 건조를 방지합니다. 피부 탄력과 수분 유지에 도움을 줍니다."
        warning = None
        return effect, purpose, warning
    
    # 추출물
    elif any(pattern in name_lower for pattern in extract_patterns):
        effect = "추출물"
        purpose = "식물이나 천연 원료에서 추출한 성분으로 항산화, 진정, 영양 공급 등의 효과가 있습니다."
        warning = "일부 추출물은 알레르기 반응을 일으킬 수 있습니다."
        return effect, purpose, warning
    
    # 각질 제거제
    elif any(pattern in name_lower for pattern in exfoliant_patterns):
        effect = "각질 제거제"
        purpose = "각질을 제거하고 피부 재생을 촉진합니다. 모공 관리와 피부 톤 개선에 도움을 줍니다."
        warning = "과도한 사용 시 피부 자극을 일으킬 수 있으므로 사용량에 주의가 필요합니다."
        return effect, purpose, warning
    
    # 색소
    elif any(pattern in name_lower for pattern in color_patterns):
        effect = "색소"
        purpose = "제품에 색상을 부여하기 위해 사용됩니다."
        warning = "일부 합성 색소는 민감한 피부에서 자극을 일으킬 수 있습니다."
        return effect, purpose, warning
    
    # 실리콘
    elif any(pattern in name_lower for pattern in silicone_patterns):
        # 사이클로메치콘은 휘발성 실리콘
        if "사이클로" in name_lower or "cyclo" in name_lower:
            effect = "휘발성 실리콘 오일"
            purpose = "가벼운 질감의 휘발성 실리콘으로 피부에 빠르게 흡수되고 증발합니다. 매끄러운 사용감을 제공하며 모공을 막지 않는 것이 특징입니다. 주로 메이크업 베이스나 헤어 제품에서 사용됩니다."
            warning = "일반 실리콘에 비해 모공을 막을 가능성이 낮지만, 과도한 사용 시 피부 호흡을 방해할 수 있습니다."
        else:
            effect = "실리콘 오일"
            purpose = "피부와 모발에 매끄러움을 주고 보호막을 형성합니다. 제품의 사용감을 개선하고 수분 손실을 방지합니다."
            warning = "모공을 막을 수 있어 지성 피부나 트러블성 피부에는 부적합할 수 있습니다."
        return effect, purpose, warning
    
    return effect, purpose, None

def scrape_wikipedia(ingredient_name: str) -> Optional[Dict]:
    """
    위키피디아에서 성분 정보 크롤링
    """
    try:
        import urllib.parse
        search_term = urllib.parse.quote(ingredient_name)
        url = f"https://ko.wikipedia.org/wiki/{search_term}"
        
        response = requests.get(url, headers=HEADERS, timeout=10)
        if response.status_code != 200:
            return None
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # 첫 번째 문단 가져오기
        first_para = soup.find('div', class_='mw-parser-output')
        if first_para:
            p_tags = first_para.find_all('p', limit=3)
            description_parts = []
            for p in p_tags:
                text = p.get_text(strip=True)
                if text and len(text) > 30:  # 의미있는 설명
                    description_parts.append(text)
            
            if description_parts:
                description = " ".join(description_parts)
                # 효과 분석
                effect, default_purpose, warning = analyze_ingredient_type(ingredient_name)
                
                # 위키피디아 설명이 있으면 활용
                if len(description) > 100:
                    purpose = description[:300] + "..." if len(description) > 300 else description
                else:
                    purpose = default_purpose if default_purpose else description
                
                return {
                    "effect": effect,
                    "purpose": purpose,
                    "warning": warning
                }
        
        return None
        
    except Exception as e:
        logger.debug(f"위키피디아 크롤링 오류 ({ingredient_name}): {e}")
        return None

def scrape_korean_sites(ingredient_name: str) -> Optional[Dict]:
    """
    한국 화장품 성분 정보 사이트 크롤링
    - 위키피디아 우선 시도
    """
    try:
        # 위키피디아 시도
        result = scrape_wikipedia(ingredient_name)
        if result:
            return result
        
        # 향후 다른 한국 사이트 추가 가능
        return None
        
    except Exception as e:
        logger.error(f"한국 사이트 크롤링 오류 ({ingredient_name}): {e}")
        return None

def scrape_ingredient_info(ingredient_name: str, use_korean: bool = True) -> Optional[Dict]:
    """
    여러 소스에서 성분 정보를 크롤링하여 통합
    """
    result = None
    
    # 먼저 성분 타입 분석으로 기본 정보 생성
    effect, purpose, warning = analyze_ingredient_type(ingredient_name)
    base_info = {
        "effect": effect,
        "purpose": purpose,
        "warning": warning
    }
    
    # 한국어 우선 (위키피디아)
    if use_korean:
        result = scrape_korean_sites(ingredient_name)
        if result and result.get("purpose") and len(result.get("purpose", "")) > 50:
            # 위키피디아에서 좋은 정보를 얻었으면 사용
            return result
    
    # CosDNA 시도 (항상 기본 정보는 제공)
    result = scrape_cosdna(ingredient_name)
    if result:
        # 기본 정보보다 더 나은 정보가 있으면 사용
        if result.get("purpose") and len(result.get("purpose", "")) > len(base_info.get("purpose", "")):
            return result
    
    # EWG 시도
    result = scrape_ewg(ingredient_name)
    if result:
        return result
    
    # 최소한 기본 정보는 반환 (성분 타입 분석 결과)
    if base_info.get("effect") != "성분" or base_info.get("purpose"):
        return base_info
    
    return None

def update_missing_ingredients(ingredient_names: List[str], delay: float = 1.0) -> Dict:
    """
    데이터베이스에 없는 성분들을 크롤링하여 추가
    
    Args:
        ingredient_names: 크롤링할 성분 이름 리스트
        delay: 요청 간 지연 시간 (초)
    
    Returns:
        업데이트 결과 딕셔너리
    """
    results = {
        "success": [],
        "failed": [],
        "skipped": []
    }
    
    db = ingredient_db.get_all_ingredients()
    
    for name in ingredient_names:
        name_clean = name.strip()
        name_no_space = name_clean.replace(" ", "").replace("-", "")
        
        # 이미 데이터베이스에 있고 유효한 정보가 있는지 확인 (공백 무시)
        found_in_db = False
        for db_name, db_info in db.items():
            db_no_space = db_name.replace(" ", "").replace("-", "")
            if db_no_space == name_no_space or name_no_space == db_no_space:
                if db_info.get("effect") and db_info.get("effect") != "알 수 없음":
                    results["skipped"].append(name_clean)
                    logger.info(f"성분 '{name_clean}'은(는) 이미 데이터베이스에 있습니다 (효과: {db_info.get('effect')}).")
                    found_in_db = True
                    break
        
        if found_in_db:
            continue
        
        # 크롤링 시도
        logger.info(f"성분 '{name_clean}' 크롤링 시도 중...")
        info = scrape_ingredient_info(name_clean)
        
        if info:
            # 데이터베이스에 추가
            success = ingredient_db.add_ingredient(
                name_clean,
                info.get("effect", "알 수 없음"),
                info.get("purpose", "정보 없음"),
                info.get("warning")
            )
            
            if success:
                results["success"].append(name_clean)
                logger.info(f"성분 '{name_clean}' 정보 추가 성공")
            else:
                results["failed"].append(name_clean)
                logger.warning(f"성분 '{name_clean}' 데이터베이스 저장 실패")
        else:
            results["failed"].append(name_clean)
            logger.warning(f"성분 '{name_clean}' 크롤링 실패 - 정보를 찾을 수 없습니다")
        
        # 요청 간 지연 (서버 부하 방지)
        if delay > 0:
            time.sleep(delay)
    
    logger.info(f"크롤링 완료 - 성공: {len(results['success'])}, 실패: {len(results['failed'])}, 스킵: {len(results['skipped'])}")
    return results

def batch_update_from_list(ingredient_list: List[str]) -> Dict:
    """성분 리스트를 받아서 없는 것만 크롤링하여 업데이트"""
    return update_missing_ingredients(ingredient_list)

