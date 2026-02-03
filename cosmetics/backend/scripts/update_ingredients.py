"""성분 데이터베이스 업데이트 스크립트"""
import sys
import os
from pathlib import Path

# 프로젝트 루트를 경로에 추가
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app.services import scraper, ingredient_db
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    """메인 함수"""
    import argparse
    
    parser = argparse.ArgumentParser(description='성분 데이터베이스 업데이트')
    parser.add_argument('--ingredients', '-i', nargs='+', help='업데이트할 성분 이름들')
    parser.add_argument('--missing', '-m', action='store_true', help='알 수 없는 성분들 자동 업데이트')
    parser.add_argument('--delay', '-d', type=float, default=1.0, help='요청 간 지연 시간 (초)')
    
    args = parser.parse_args()
    
    if args.missing:
        # 알 수 없는 성분들 자동 업데이트
        logger.info("알 수 없는 성분 검색 중...")
        db = ingredient_db.get_all_ingredients()
        unknown_ingredients = [
            name for name, info in db.items()
            if info.get("effect") == "알 수 없음"
        ]
        
        if not unknown_ingredients:
            logger.info("업데이트할 성분이 없습니다.")
            return
        
        logger.info(f"발견된 알 수 없는 성분: {len(unknown_ingredients)}개")
        logger.info(f"예: {', '.join(unknown_ingredients[:5])}...")
        
        results = scraper.update_missing_ingredients(unknown_ingredients, delay=args.delay)
        
        logger.info(f"\n업데이트 완료:")
        logger.info(f"  성공: {len(results['success'])}개")
        logger.info(f"  실패: {len(results['failed'])}개")
        logger.info(f"  스킵: {len(results['skipped'])}개")
        
    elif args.ingredients:
        # 지정한 성분들 업데이트
        logger.info(f"지정한 성분 {len(args.ingredients)}개 업데이트 중...")
        results = scraper.update_missing_ingredients(args.ingredients, delay=args.delay)
        
        logger.info(f"\n업데이트 완료:")
        logger.info(f"  성공: {len(results['success'])}개")
        logger.info(f"  실패: {len(results['failed'])}개")
        logger.info(f"  스킵: {len(results['skipped'])}개")
        
        if results['success']:
            logger.info(f"\n성공한 성분: {', '.join(results['success'])}")
        if results['failed']:
            logger.info(f"\n실패한 성분: {', '.join(results['failed'])}")
    else:
        parser.print_help()

if __name__ == "__main__":
    main()

