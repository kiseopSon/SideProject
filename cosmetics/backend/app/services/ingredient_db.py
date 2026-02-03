"""성분 데이터베이스 관리 모듈"""
import json
import os
from typing import Dict, Optional
from pathlib import Path

# 데이터베이스 파일 경로
DB_FILE = Path(__file__).parent.parent.parent / "ingredients_database.json"

def load_database() -> Dict:
    """데이터베이스 파일에서 성분 데이터 로드"""
    if not DB_FILE.exists():
        # 기본 빈 데이터베이스 생성
        save_database({})
        return {}
    
    try:
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError:
        # JSON 파싱 오류 시 빈 데이터베이스 반환
        return {}
    except Exception as e:
        print(f"데이터베이스 로드 오류: {e}")
        return {}

def save_database(data: Dict) -> bool:
    """성분 데이터를 데이터베이스 파일에 저장"""
    try:
        # 디렉토리가 없으면 생성
        DB_FILE.parent.mkdir(parents=True, exist_ok=True)
        
        with open(DB_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"데이터베이스 저장 오류: {e}")
        return False

def get_ingredient(name: str) -> Optional[Dict]:
    """특정 성분 정보 가져오기"""
    db = load_database()
    return db.get(name)

def add_ingredient(name: str, effect: str, purpose: str, warning: Optional[str] = None) -> bool:
    """새로운 성분 추가 또는 업데이트"""
    db = load_database()
    db[name] = {
        "effect": effect,
        "purpose": purpose,
        "warning": warning
    }
    return save_database(db)

def update_ingredient(name: str, **kwargs) -> bool:
    """기존 성분 정보 업데이트"""
    db = load_database()
    if name not in db:
        return False
    
    for key, value in kwargs.items():
        if key in ["effect", "purpose", "warning"]:
            db[name][key] = value
    
    return save_database(db)

def bulk_add_ingredients(ingredients: Dict) -> int:
    """여러 성분을 한 번에 추가"""
    db = load_database()
    count = 0
    
    for name, info in ingredients.items():
        if name not in db or info != db.get(name):
            db[name] = info
            count += 1
    
    if count > 0:
        save_database(db)
    
    return count

def get_all_ingredients() -> Dict:
    """모든 성분 데이터 가져오기"""
    return load_database()

