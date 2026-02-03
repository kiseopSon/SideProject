import psycopg2

# DB 연결
conn = psycopg2.connect(
    host="localhost",
    port=5432,
    dbname="postgres",
    user="postgres",
    password="1111"
)
cursor = conn.cursor()

try:
    # 기존 테이블 삭제
    cursor.execute("DROP TABLE IF EXISTS public.house_rent_contracts_more")
    print("✅ 기존 테이블 삭제 완료")

    # 고유 제약조건이 포함된 테이블 생성
    cursor.execute("""
        CREATE TABLE public.house_rent_contracts_more (
            result_code varchar(3) NOT NULL,
            result_msg varchar(100) NOT NULL,
            num_of_rows int4 NOT NULL,
            page_no int4 NOT NULL,
            total_count int4 NOT NULL,
            sgg_cd varchar(5) NOT NULL,
            house_type varchar(6) NULL,
            mhouse_nm varchar(50) NULL,
            umd_nm varchar(30) NOT NULL,
            jibun varchar(20) NULL,
            exclu_use_ar numeric(22, 2) NULL,
            deal_year int4 NOT NULL,
            deal_month int4 NOT NULL,
            deal_day int4 NOT NULL,
            deposit numeric(15) NOT NULL,
            monthly_rent numeric(15) NOT NULL,
            floor int4 NULL,
            build_year int4 NULL,
            contract_term varchar(12) NULL,
            contract_type varchar(4) NULL,
            user_rr_right varchar(4) NULL,
            pre_deposit numeric(15) NULL,
            pre_monthly_rent numeric(15) NULL,

            -- 고유 제약조건: 같은 지역/날짜/동네/집 유형/금액/건축연도 조합은 중복 불가
            CONSTRAINT house_rent_contracts_more_unique_key 
            UNIQUE (sgg_cd, deal_year, deal_month, deal_day, umd_nm, house_type, mhouse_nm, deposit, monthly_rent, build_year)
        )
    """)
    print("✅ 테이블 생성 완료")

    # 인덱스 추가 (조회 성능 향상)
    cursor.execute("CREATE INDEX idx_house_rent_contracts_more_sgg_cd ON public.house_rent_contracts_more(sgg_cd)")
    cursor.execute("""
        CREATE INDEX idx_house_rent_contracts_more_deal_date 
        ON public.house_rent_contracts_more(deal_year, deal_month, deal_day)
    """)
    cursor.execute("CREATE INDEX idx_house_rent_contracts_more_umd_nm ON public.house_rent_contracts_more(umd_nm)")
    print("✅ 인덱스 생성 완료")

    conn.commit()
    print("🎉 모든 작업 완료!")

except Exception as e:
    print(f"❌ 오류 발생: {e}")
    conn.rollback()

cursor.close()
conn.close()
