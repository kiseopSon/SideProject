"""관리자용 API 라우트 (성분 추가/업데이트)"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from app.services import ingredient_db, scraper

router = APIRouter(prefix="/api/admin", tags=["admin"])

class AddIngredientRequest(BaseModel):
    name: str
    effect: str
    purpose: str
    warning: Optional[str] = None

class BulkUpdateRequest(BaseModel):
    ingredients: Dict[str, Dict[str, Optional[str]]]  # {name: {effect, purpose, warning}}

class ScrapeRequest(BaseModel):
    ingredient_names: List[str]
    delay: float = 1.0

@router.post("/ingredient/add")
async def add_ingredient(request: AddIngredientRequest):
    """새로운 성분 추가"""
    success = ingredient_db.add_ingredient(
        request.name,
        request.effect,
        request.purpose,
        request.warning
    )
    
    if success:
        return {"message": "성분이 추가되었습니다", "name": request.name}
    else:
        raise HTTPException(status_code=500, detail="성분 추가 실패")

@router.post("/ingredient/bulk-add")
async def bulk_add_ingredients(request: BulkUpdateRequest):
    """여러 성분을 한 번에 추가"""
    count = ingredient_db.bulk_add_ingredients(request.ingredients)
    return {
        "message": f"{count}개의 성분이 추가/업데이트되었습니다",
        "updated_count": count
    }

@router.get("/ingredient/{name}")
async def get_ingredient(name: str):
    """특정 성분 정보 조회"""
    ingredient = ingredient_db.get_ingredient(name)
    if ingredient:
        return {"name": name, **ingredient}
    else:
        raise HTTPException(status_code=404, detail="성분을 찾을 수 없습니다")

@router.get("/ingredients/count")
async def get_ingredient_count():
    """전체 성분 개수 조회"""
    db = ingredient_db.get_all_ingredients()
    return {"total_count": len(db)}

@router.post("/scrape")
async def scrape_ingredients(request: ScrapeRequest):
    """성분 정보 크롤링"""
    if len(request.ingredient_names) > 20:
        raise HTTPException(status_code=400, detail="한 번에 최대 20개의 성분만 크롤링할 수 있습니다")
    
    results = scraper.update_missing_ingredients(
        request.ingredient_names,
        delay=request.delay
    )
    
    return {
        "message": "크롤링 완료",
        "results": results
    }

@router.post("/scrape/missing")
async def scrape_missing_ingredients():
    """데이터베이스에 '알 수 없음'으로 표시된 성분들 크롤링"""
    db = ingredient_db.get_all_ingredients()
    unknown_ingredients = [
        name for name, info in db.items()
        if info.get("effect") == "알 수 없음"
    ]
    
    if not unknown_ingredients:
        return {
            "message": "업데이트할 성분이 없습니다",
            "results": {"success": [], "failed": [], "skipped": []}
        }
    
    results = scraper.update_missing_ingredients(unknown_ingredients[:10])
    
    return {
        "message": f"{len(unknown_ingredients)}개의 성분 중 {len(results['success'])}개 업데이트 완료",
        "results": results
    }

@router.post("/scrape/from-analysis")
async def scrape_from_analysis(request: ScrapeRequest):
    """분석 결과에서 알 수 없는 성분들을 크롤링"""
    if len(request.ingredient_names) == 0:
        return {
            "message": "업데이트할 성분이 없습니다",
            "results": {"success": [], "failed": [], "skipped": []}
        }
    
    if len(request.ingredient_names) > 20:
        raise HTTPException(status_code=400, detail="한 번에 최대 20개의 성분만 크롤링할 수 있습니다")
    
    results = scraper.update_missing_ingredients(
        request.ingredient_names,
        delay=request.delay
    )
    
    return {
        "message": f"{len(request.ingredient_names)}개의 성분 중 {len(results['success'])}개 업데이트 완료",
        "results": results
    }

