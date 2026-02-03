"""주기적 데이터베이스 업데이트 스케줄러"""
import schedule
import time
import logging
from datetime import datetime
from app.services import scraper
from app.services import ingredient_db

logger = logging.getLogger(__name__)

def update_database_job():
    """주기적으로 실행될 업데이트 작업"""
    logger.info(f"[{datetime.now()}] 데이터베이스 업데이트 시작")
    
    try:
        # 데이터베이스에서 알 수 없는 성분들 찾기
        db = ingredient_db.get_all_ingredients()
        unknown_ingredients = [
            name for name, info in db.items() 
            if info.get("effect") == "알 수 없음"
        ]
        
        if unknown_ingredients:
            logger.info(f"업데이트할 성분: {len(unknown_ingredients)}개")
            results = scraper.update_missing_ingredients(unknown_ingredients[:10])  # 한 번에 최대 10개
            logger.info(f"업데이트 완료 - 성공: {len(results['success'])}, 실패: {len(results['failed'])}")
        else:
            logger.info("업데이트할 성분이 없습니다")
            
    except Exception as e:
        logger.error(f"데이터베이스 업데이트 오류: {e}")

def start_scheduler(interval_hours: int = 24):
    """
    스케줄러 시작
    
    Args:
        interval_hours: 업데이트 주기 (시간 단위)
    """
    # 매일 정해진 시간에 실행
    schedule.every(interval_hours).hours.do(update_database_job)
    
    logger.info(f"스케줄러 시작 - 업데이트 주기: {interval_hours}시간")
    
    # 스케줄러 실행 루프
    while True:
        schedule.run_pending()
        time.sleep(60)  # 1분마다 체크

if __name__ == "__main__":
    # 직접 실행 시 테스트
    logging.basicConfig(level=logging.INFO)
    start_scheduler(interval_hours=24)

