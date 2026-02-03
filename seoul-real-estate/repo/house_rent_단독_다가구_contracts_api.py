import requests
import psycopg2
import xml.etree.ElementTree as ET
from datetime import datetime
import urllib3
import ssl
import certifi
import os
import subprocess
import sys
from requests.adapters import HTTPAdapter
from urllib3.util.ssl_ import create_urllib3_context

# SSL 경고 비활성화
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# 방법 1: 환경 변수 설정
os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()
os.environ['SSL_CERT_FILE'] = certifi.where()
os.environ['PYTHONHTTPSVERIFY'] = '0'

# 방법 2: SSL 컨텍스트 완전 비활성화
ssl._create_default_https_context = ssl._create_unverified_context

# DB 연결 정보
conn = psycopg2.connect(
    host="localhost",
    port=5432,
    dbname="postgres",
    user="postgres",
    password="1111"
)
cursor = conn.cursor()

# 고정 값
SERVICE_KEY = "uDrMWcY7Ab5DDjWUaIhL4EmCOIskE4YqaZJ+FQo8TJvcnotpU6nOgaCjTQbzANLgd7xABL/I9IJJX9Vs5wYZKA=="
NUM_OF_ROWS = 100  # 한 번에 가져올 개수

# 서울시 모든 구 지역코드
SEOUL_DISTRICTS = {
    "강남구": "11680",
    "강동구": "11740",
    "강북구": "11305",
    "강서구": "11500",
    "관악구": "11620",
    "광진구": "11215",
    "구로구": "11530",
    "금천구": "11545",
    "노원구": "11350",
    "도봉구": "11320",
    "동대문구": "11140",
    "동작구": "11590",
    "마포구": "11440",
    "서대문구": "11410",
    "서초구": "11650",
    "성동구": "11110",
    "성북구": "11230",
    "송파구": "11710",
    "양천구": "11470",
    "영등포구": "11560",
    "용산구": "11170",
    "은평구": "11380",
    "종로구": "11110",
    "중구": "11140",
    "중랑구": "11260"
}


def get_latest_data_year():
    """테이블에서 가장 최근 데이터의 연도를 조회"""
    try:
        cursor.execute("""
            SELECT MAX(deal_year) as latest_year
            FROM public.house_rent_contracts
        """)
        result = cursor.fetchone()
        latest_year = result[0] if result and result[0] else None
        return latest_year
    except Exception as e:
        print(f"최근 데이터 연도 조회 오류: {e}")
        return None


def determine_collection_period():
    """수집 기간을 결정 (연도 자동 감지)"""
    current_year = datetime.now().year
    current_month = datetime.now().month

    # 테스트용: 2026년으로 시뮬레이션
    # current_year = 2026  # 이 줄을 주석 해제하면 2026년으로 테스트 가능

    # 테이블에서 가장 최근 데이터 연도 조회
    latest_db_year = get_latest_data_year()

    if latest_db_year is None:
        # 테이블이 비어있거나 오류 발생 시 현재 연도 1월부터 시작
        print(f"📊 테이블이 비어있거나 오류 발생. {current_year}년 1월부터 수집 시작")
        start_ym = current_year * 100 + 1
        end_ym = current_year * 100 + current_month
    else:
        # 기존 데이터가 있는 경우
        if latest_db_year < current_year:
            # 연도가 바뀌었음 - 새로운 연도 1월부터 수집
            print(f"🔄 연도 변경 감지! {latest_db_year}년 → {current_year}년")
            print(f"📊 {current_year}년 1월부터 {current_month}월까지 수집 시작")
            start_ym = current_year * 100 + 1
            end_ym = current_year * 100 + current_month
        elif latest_db_year == current_year:
            # 같은 연도 - 1월부터 현재 월까지 수집 (누적)
            print(f"📊 {current_year}년 1월부터 {current_month}월까지 수집 시작")
            start_ym = current_year * 100 + 1
            end_ym = current_year * 100 + current_month
        else:
            # 미래 연도 데이터가 있는 경우 (비정상)
            print(f"⚠️ 경고: 미래 연도({latest_db_year}) 데이터가 있습니다. 현재 연도({current_year})로 수집합니다.")
            start_ym = current_year * 100 + 1
            end_ym = current_year * 100 + current_month

    return start_ym, end_ym


# 방법 3: 커스텀 SSL 컨텍스트
ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS)
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE
ssl_context.set_ciphers('DEFAULT@SECLEVEL=1')

# 방법 4: requests 세션 설정
session = requests.Session()
session.verify = False


# 방법 5: 커스텀 어댑터
class CustomHTTPAdapter(HTTPAdapter):
    def init_poolmanager(self, *args, **kwargs):
        context = create_urllib3_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        context.set_ciphers('DEFAULT@SECLEVEL=1')
        kwargs['ssl_context'] = context
        return super().init_poolmanager(*args, **kwargs)

    def proxy_manager_for(self, *args, **kwargs):
        context = create_urllib3_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        context.set_ciphers('DEFAULT@SECLEVEL=1')
        kwargs['ssl_context'] = context
        return super().proxy_manager_for(*args, **kwargs)


adapter = CustomHTTPAdapter()
session.mount("https://", adapter)
session.mount("http://", adapter)


def clean_numeric_value(value):
    """문자열에서 숫자만 추출하여 반환"""
    if value is None or value == "":
        return None
    try:
        return int(float(value))  # 소수점 있는 숫자도 정수로 변환
    except ValueError:
        return None


def clean_deposit_value(value):
    """deposit 값을 정리하여 반환 (NULL이면 0으로 설정)"""
    cleaned = clean_numeric_value(value)
    return cleaned if cleaned is not None else 0


def get_items(lawd_cd, deal_ymd, page_no):
    """API 호출 후 item 리스트 반환"""
    url = "https://apis.data.go.kr/1613000/RTMSDataSvcSHRent/getRTMSDataSvcSHRent"
    params = {
        "serviceKey": SERVICE_KEY,
        "LAWD_CD": lawd_cd,
        "DEAL_YMD": str(deal_ymd),
        "pageNo": str(page_no),
        "numOfRows": str(NUM_OF_ROWS)
    }

    print(f"  방법 1 시도 중...")

    # 여러 방법으로 시도
    methods = [
        lambda: session.get(url, params=params, timeout=30),
        lambda: session.get(url, params=params, timeout=30, verify=False),
        lambda: requests.get(url, params=params, timeout=30, verify=False),
        lambda: requests.get(url, params=params, timeout=30, verify=False, ssl_context=ssl_context),
        lambda: session.get(url, params=params, timeout=30, verify=False, ssl_context=ssl_context)
    ]

    for i, method in enumerate(methods):
        try:
            response = method()
            if response.status_code == 200:
                print(f"  방법 {i + 1} 성공!")
                root = ET.fromstring(response.content)
                items = root.findall(".//item")
                return root, items
            else:
                print(f"  방법 {i + 1} 실패: {response.status_code}")
        except Exception as e:
            print(f"  방법 {i + 1} 오류: {e}")
            continue

    # 방법 7: curl 명령어 사용 (최후의 수단)
    try:
        print(f"  방법 7 (curl) 시도 중...")
        curl_command = [
            "curl", "-s", "-k", "--connect-timeout", "30",
            f"{url}?serviceKey={SERVICE_KEY}&LAWD_CD={lawd_cd}&DEAL_YMD={deal_ymd}&pageNo={page_no}&numOfRows={NUM_OF_ROWS}"
        ]

        result = subprocess.run(curl_command, capture_output=True, text=True, timeout=60)
        if result.returncode == 0 and result.stdout.strip():
            root = ET.fromstring(result.stdout)
            items = root.findall(".//item")
            print(f"  방법 7 성공!")
            return root, items
        else:
            print(f"  방법 7 실패: {result.stderr}")
    except Exception as e:
        print(f"  방법 7 오류: {e}")

    return None, []


def insert_or_update_item(root, item):
    """파싱한 데이터 insert 또는 update (중복 방지) - PostgreSQL ON CONFLICT 사용"""
    try:
        result_code = root.findtext(".//resultCode")
        result_msg = root.findtext(".//resultMsg")
        num_of_rows = root.findtext(".//numOfRows")
        page_no = root.findtext(".//pageNo")
        total_count = root.findtext(".//totalCount")

        sgg_cd = item.findtext("sggCd")
        house_type = item.findtext("houseType")
        umd_nm = item.findtext("umdNm")
        total_floor_ar = item.findtext("totalFloorAr")
        deal_year = item.findtext("dealYear")
        deal_month = item.findtext("dealMonth")
        deal_day = item.findtext("dealDay")
        deposit = item.findtext("deposit")
        monthly_rent = item.findtext("monthlyRent")
        build_year = item.findtext("buildYear")
        contract_term = item.findtext("contractTerm")
        contract_type = item.findtext("contractType")
        use_rr_right = item.findtext("useRRRight")
        pre_deposit = item.findtext("preDeposit")
        pre_monthly_rent = item.findtext("preMonthlyRent")

        # numeric 타입으로 변환이 필요한 필드들 정리
        total_floor_ar = clean_numeric_value(total_floor_ar)
        deal_year = clean_numeric_value(deal_year)
        deal_month = clean_numeric_value(deal_month)
        deal_day = clean_numeric_value(deal_day)
        deposit = clean_deposit_value(deposit)
        monthly_rent = clean_numeric_value(monthly_rent)
        build_year = clean_numeric_value(build_year)
        pre_deposit = clean_numeric_value(pre_deposit)
        pre_monthly_rent = clean_numeric_value(pre_monthly_rent)

        # PostgreSQL ON CONFLICT를 사용한 UPSERT
        cursor.execute("""
            INSERT INTO public.house_rent_contracts (
                result_code, result_msg, num_of_rows, page_no, total_count,
                sgg_cd, house_type, umd_nm, total_floor_ar,
                deal_year, deal_month, deal_day,
                deposit, monthly_rent, build_year,
                contract_term, contract_type, user_rr_right,
                pre_deposit, pre_monthly_rent
            ) VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s,
                %s, %s
            )
                                 ON CONFLICT (sgg_cd, deal_year, deal_month, deal_day, umd_nm, house_type, deposit, monthly_rent, build_year)
                     DO UPDATE SET
                result_code = EXCLUDED.result_code,
                result_msg = EXCLUDED.result_msg,
                num_of_rows = EXCLUDED.num_of_rows,
                page_no = EXCLUDED.page_no,
                total_count = EXCLUDED.total_count,
                total_floor_ar = EXCLUDED.total_floor_ar,
                deposit = EXCLUDED.deposit,
                monthly_rent = EXCLUDED.monthly_rent,
                build_year = EXCLUDED.build_year,
                contract_term = EXCLUDED.contract_term,
                contract_type = EXCLUDED.contract_type,
                user_rr_right = EXCLUDED.user_rr_right,
                pre_deposit = EXCLUDED.pre_deposit,
                pre_monthly_rent = EXCLUDED.pre_monthly_rent
        """, (
            result_code, result_msg, num_of_rows, page_no, total_count,
            sgg_cd, house_type, umd_nm, total_floor_ar,
            deal_year, deal_month, deal_day,
            deposit, monthly_rent, build_year,
            contract_term, contract_type, use_rr_right,
            pre_deposit, pre_monthly_rent
        ))

        conn.commit()
        print(f"데이터 처리 완료: {sgg_cd} - {deal_year}/{deal_month}/{deal_day}")

    except Exception as e:
        print(f"데이터 처리 오류: {e}")
        conn.rollback()


def collect_data_for_district(district_name, lawd_cd, start_ym, end_ym):
    """특정 구의 데이터 수집"""
    print(f"\n=== {district_name}({lawd_cd}) 데이터 수집 시작 ===")

    total_inserted = 0

    for ym in range(start_ym, end_ym + 1):
        year = ym // 100
        month = ym % 100
        if not (1 <= month <= 12):
            continue  # 잘못된 월 건너뜀

        print(f"수집 시작: {ym}")
        page = 1
        monthly_inserted = 0

        while True:
            root, items = get_items(lawd_cd, ym, page)
            if root is None:
                print(f"  {ym} {page} 페이지 처리 실패, 다음 페이지로 이동")
                page += 1
                if page > 10:  # 최대 10페이지까지만 시도
                    break
                continue

            if not items:
                print(f"  {ym} {page} 페이지에 데이터 없음")
                break  # 데이터 없음 → 다음 달로 이동

            for item in items:
                insert_or_update_item(root, item)
                total_inserted += 1
                monthly_inserted += 1

            print(f"  {ym} {page} 페이지 적재 완료 (rows={len(items)})")

            # totalCount와 numOfRows로 마지막 페이지 여부 확인
            total_count = int(root.findtext(".//totalCount") or "0")
            num_of_rows = int(root.findtext(".//numOfRows") or "0")
            if page * num_of_rows >= total_count:
                break
            page += 1

        print(f"  {ym} 월 총 {monthly_inserted}개 데이터 삽입 완료")

    print(f"=== {district_name} 총 {total_inserted}개 데이터 수집 완료 ===\n")
    return total_inserted


# 메인 실행
if __name__ == "__main__":
    print("🏠 서울시 모든 구 월세 데이터 수집 시작")
    print("=" * 50)

    # 수집 기간 자동 결정
    start_ym, end_ym = determine_collection_period()

    if start_ym is None or end_ym is None:
        print("✅ 수집할 새로운 데이터가 없습니다.")
        cursor.close()
        conn.close()
        session.close()
        sys.exit(0)

    print(f"📅 수집 기간: {start_ym} ~ {end_ym}")
    print(f"🏘️ 총 {len(SEOUL_DISTRICTS)}개 구 수집 예정")
    print("=" * 50)

    grand_total = 0

    for district_name, lawd_cd in SEOUL_DISTRICTS.items():
        try:
            inserted_count = collect_data_for_district(district_name, lawd_cd, start_ym, end_ym)
            grand_total += inserted_count
        except Exception as e:
            print(f"❌ {district_name} 수집 중 오류 발생: {e}")
            continue

    # 커밋 및 종료
    conn.commit()
    cursor.close()
    conn.close()
    session.close()

    print("=" * 50)
    print(f"🎉 모든 데이터 수집 완료! 총 {grand_total}개 데이터 삽입 ✅")