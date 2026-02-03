import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// CORS 설정
app.use(cors());
app.use(express.json());

// 정적 파일 서빙 (빌드된 React 앱)
app.use(express.static(path.join(__dirname, 'dist')));

// PostgreSQL 연결 설정
const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: "1111"
});

// 연결 테스트
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('데이터베이스 연결 오류:', err);
  } else {
    console.log('데이터베이스 연결 성공:', res.rows[0]);
  }
});

// 전체 통계 요약 API (모든 테이블 통합)
app.get('/api/statistics/overall', async (req, res) => {
  try {
    const query = `
      WITH all_contracts AS (
        SELECT sgg_cd, umd_nm, deal_year, '단독/다가구' as house_type FROM house_rent_contracts
        WHERE contract_type IS NOT NULL AND contract_type != '' AND contract_type != ' '
        AND pre_deposit IS NOT NULL AND pre_deposit > 0
        AND pre_monthly_rent IS NOT NULL AND pre_monthly_rent > 0
        
        UNION ALL
        
        SELECT sgg_cd, umd_nm, deal_year, '아파트' as house_type FROM house_rent_contracts_apt
        WHERE apt_nm IS NOT NULL AND apt_nm != '' AND apt_nm != ' '
        AND floor IS NOT NULL AND floor > 0
        AND contract_type IS NOT NULL AND contract_type != '' AND contract_type != ' '
        AND pre_deposit IS NOT NULL AND pre_deposit > 0
        AND pre_monthly_rent IS NOT NULL AND pre_monthly_rent > 0
        
        UNION ALL
        
        SELECT sgg_cd, umd_nm, deal_year, '연립/다세대' as house_type FROM house_rent_contracts_more
        WHERE mhouse_nm IS NOT NULL AND mhouse_nm != '' AND mhouse_nm != ' '
        AND floor IS NOT NULL AND floor > 0
        AND contract_type IS NOT NULL AND contract_type != '' AND contract_type != ' '
        AND pre_deposit IS NOT NULL AND pre_deposit > 0
        AND pre_monthly_rent IS NOT NULL AND pre_monthly_rent > 0
        
        UNION ALL
        
        SELECT sgg_cd, umd_nm, deal_year, '오피스텔' as house_type FROM house_rent_contracts_opp
        WHERE offiname IS NOT NULL AND offiname != '' AND offiname != ' '
        AND floor IS NOT NULL AND floor > 0
        AND contract_type IS NOT NULL AND contract_type != '' AND contract_type != ' '
        AND pre_deposit IS NOT NULL AND pre_deposit > 0
        AND pre_monthly_rent IS NOT NULL AND pre_monthly_rent > 0
      )
      SELECT 
        COUNT(*) as total_contracts,
        COUNT(DISTINCT sgg_cd) as total_districts,
        COUNT(DISTINCT umd_nm) as total_dongs,
        COUNT(DISTINCT house_type) as total_house_types,
        MIN(deal_year) as earliest_year,
        MAX(deal_year) as latest_year
      FROM all_contracts
    `;
    
    const result = await pool.query(query);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('전체 통계 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 지역별 통계 API (모든 테이블 통합)
app.get('/api/statistics/districts', async (req, res) => {
  try {
    const query = `
      WITH all_contracts AS (
        SELECT sgg_cd, umd_nm FROM house_rent_contracts
        WHERE contract_type IS NOT NULL AND contract_type != '' AND contract_type != ' '
        AND pre_deposit IS NOT NULL AND pre_deposit > 0
        AND pre_monthly_rent IS NOT NULL AND pre_monthly_rent > 0
        
        UNION ALL
        
        SELECT sgg_cd, umd_nm FROM house_rent_contracts_apt
        WHERE apt_nm IS NOT NULL AND apt_nm != '' AND apt_nm != ' '
        AND floor IS NOT NULL AND floor > 0
        AND contract_type IS NOT NULL AND contract_type != '' AND contract_type != ' '
        AND pre_deposit IS NOT NULL AND pre_deposit > 0
        AND pre_monthly_rent IS NOT NULL AND pre_monthly_rent > 0
        
        UNION ALL
        
        SELECT sgg_cd, umd_nm FROM house_rent_contracts_more
        WHERE mhouse_nm IS NOT NULL AND mhouse_nm != '' AND mhouse_nm != ' '
        AND floor IS NOT NULL AND floor > 0
        AND contract_type IS NOT NULL AND contract_type != '' AND contract_type != ' '
        AND pre_deposit IS NOT NULL AND pre_deposit > 0
        AND pre_monthly_rent IS NOT NULL AND pre_monthly_rent > 0
        
        UNION ALL
        
        SELECT sgg_cd, umd_nm FROM house_rent_contracts_opp
        WHERE offiname IS NOT NULL AND offiname != '' AND offiname != ' '
        AND floor IS NOT NULL AND floor > 0
        AND contract_type IS NOT NULL AND contract_type != '' AND contract_type != ' '
        AND pre_deposit IS NOT NULL AND pre_deposit > 0
        AND pre_monthly_rent IS NOT NULL AND pre_monthly_rent > 0
      )
      SELECT 
        sgg_cd,
        COUNT(*) as total_contracts,
        COUNT(DISTINCT umd_nm) as unique_dongs
      FROM all_contracts 
      GROUP BY sgg_cd 
      ORDER BY sgg_cd
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('지역별 통계 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 동별 통계 API (모든 테이블 통합)
app.get('/api/statistics/dongs', async (req, res) => {
  try {
    const query = `
      WITH all_contracts AS (
        SELECT sgg_cd, umd_nm FROM house_rent_contracts
        WHERE contract_type IS NOT NULL AND contract_type != '' AND contract_type != ' '
        AND pre_deposit IS NOT NULL AND pre_deposit > 0
        AND pre_monthly_rent IS NOT NULL AND pre_monthly_rent > 0
        
        UNION ALL
        
        SELECT sgg_cd, umd_nm FROM house_rent_contracts_apt
        WHERE apt_nm IS NOT NULL AND apt_nm != '' AND apt_nm != ' '
        AND floor IS NOT NULL AND floor > 0
        AND contract_type IS NOT NULL AND contract_type != '' AND contract_type != ' '
        AND pre_deposit IS NOT NULL AND pre_deposit > 0
        AND pre_monthly_rent IS NOT NULL AND pre_monthly_rent > 0
        
        UNION ALL
        
        SELECT sgg_cd, umd_nm FROM house_rent_contracts_more
        WHERE mhouse_nm IS NOT NULL AND mhouse_nm != '' AND mhouse_nm != ' '
        AND floor IS NOT NULL AND floor > 0
        AND contract_type IS NOT NULL AND contract_type != '' AND contract_type != ' '
        AND pre_deposit IS NOT NULL AND pre_deposit > 0
        AND pre_monthly_rent IS NOT NULL AND pre_monthly_rent > 0
        
        UNION ALL
        
        SELECT sgg_cd, umd_nm FROM house_rent_contracts_opp
        WHERE offiname IS NOT NULL AND offiname != '' AND offiname != ' '
        AND floor IS NOT NULL AND floor > 0
        AND contract_type IS NOT NULL AND contract_type != '' AND contract_type != ' '
        AND pre_deposit IS NOT NULL AND pre_deposit > 0
        AND pre_monthly_rent IS NOT NULL AND pre_monthly_rent > 0
      )
      SELECT 
        sgg_cd,
        umd_nm,
        COUNT(*) as contract_count
      FROM all_contracts 
      GROUP BY sgg_cd, umd_nm 
      ORDER BY sgg_cd, contract_count DESC
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('동별 통계 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 동별 상세 계약 정보 API (모든 테이블 통합)
app.get('/api/contracts/dong/:sgg_cd/:umd_nm', async (req, res) => {
  try {
    const { sgg_cd, umd_nm } = req.params;
    
    console.log('상세 계약 정보 요청:', { sgg_cd, umd_nm });
    
    const query = `
      WITH all_contracts AS (
        SELECT 
          sgg_cd,
          umd_nm,
          house_type,
          total_floor_ar as floor_area,
          deal_year,
          deal_month,
          deal_day,
          deposit,
          monthly_rent,
          build_year,
          contract_term,
          contract_type,
          user_rr_right,
          pre_deposit,
          pre_monthly_rent,
          result_code,
          result_msg,
          num_of_rows,
          page_no,
          total_count,
          '단독/다가구' as house_type_name,
          NULL as building_name,
          NULL as floor
        FROM house_rent_contracts 
        WHERE sgg_cd = $1 AND umd_nm = $2
        AND (contract_type IS NOT NULL AND contract_type != '' AND contract_type != ' ')
        AND (pre_deposit IS NOT NULL AND pre_deposit > 0)
        AND (pre_monthly_rent IS NOT NULL AND pre_monthly_rent > 0)
        
        UNION ALL
        
        SELECT 
          sgg_cd,
          umd_nm,
          NULL as house_type,
          exclu_use_ar as floor_area,
          deal_year,
          deal_month,
          deal_day,
          deposit,
          monthly_rent,
          build_year,
          contract_term,
          contract_type,
          user_rr_right,
          pre_deposit,
          pre_monthly_rent,
          result_code,
          result_msg,
          num_of_rows,
          page_no,
          total_count,
          '아파트' as house_type_name,
          apt_nm as building_name,
          floor
        FROM house_rent_contracts_apt 
        WHERE sgg_cd = $1 AND umd_nm = $2
        AND (floor IS NOT NULL AND floor > 0)
        AND (contract_type IS NOT NULL AND contract_type != '' AND contract_type != ' ')
        AND (pre_deposit IS NOT NULL AND pre_deposit > 0)
        AND (pre_monthly_rent IS NOT NULL AND pre_monthly_rent > 0)
        
        UNION ALL
        
        SELECT 
          sgg_cd,
          umd_nm,
          house_type,
          exclu_use_ar as floor_area,
          deal_year,
          deal_month,
          deal_day,
          deposit,
          monthly_rent,
          build_year,
          contract_term,
          contract_type,
          user_rr_right,
          pre_deposit,
          pre_monthly_rent,
          result_code,
          result_msg,
          num_of_rows,
          page_no,
          total_count,
          '연립/다세대' as house_type_name,
          mhouse_nm as building_name,
          floor
        FROM house_rent_contracts_more 
        WHERE sgg_cd = $1 AND umd_nm = $2
        AND (floor IS NOT NULL AND floor > 0)
        AND (contract_type IS NOT NULL AND contract_type != '' AND contract_type != ' ')
        AND (pre_deposit IS NOT NULL AND pre_deposit > 0)
        AND (pre_monthly_rent IS NOT NULL AND pre_monthly_rent > 0)
        
        UNION ALL
        
        SELECT 
          sgg_cd,
          umd_nm,
          '오피스텔' as house_type,
          exclu_use_ar as floor_area,
          deal_year,
          deal_month,
          deal_day,
          deposit,
          monthly_rent,
          build_year,
          contract_term,
          contract_type,
          user_rr_right,
          pre_deposit,
          pre_monthly_rent,
          result_code,
          result_msg,
          num_of_rows,
          page_no,
          total_count,
          '오피스텔' as house_type_name,
          COALESCE(NULLIF(offiname, ''), '건물명 없음') as building_name,
          floor
        FROM house_rent_contracts_opp 
        WHERE sgg_cd = $1 AND umd_nm = $2
        AND (floor IS NOT NULL AND floor > 0)
        AND (contract_type IS NOT NULL AND contract_type != '' AND contract_type != ' ')
        AND (pre_deposit IS NOT NULL AND pre_deposit > 0)
        AND (pre_monthly_rent IS NOT NULL AND pre_monthly_rent > 0)
      )
      SELECT * FROM all_contracts
      ORDER BY deal_year DESC, deal_month DESC, deal_day DESC
    `;
    
    const result = await pool.query(query, [sgg_cd, umd_nm]);
    console.log('조회된 계약 정보 수:', result.rows.length);
    
    // 오피스텔 건물명 디버깅
    const officetelData = result.rows.filter(row => 
      row.house_type_name === '오피스텔' || row.house_type === '오피스텔'
    );
    if (officetelData.length > 0) {
      console.log('오피스텔 데이터 샘플:', {
        building_name: officetelData[0].building_name,
        house_type_name: officetelData[0].house_type_name,
        house_type: officetelData[0].house_type
      });
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('동별 상세 계약 정보 조회 오류:', error);
    console.error('오류 상세:', {
      message: error.message,
      stack: error.stack,
      params: req.params
    });
    res.status(500).json({ 
      error: '서버 오류가 발생했습니다.',
      details: error.message 
    });
  }
});

// 주택 유형별 통계 API
app.get('/api/statistics/house-types', async (req, res) => {
  try {
    const query = `
      WITH house_type_stats AS (
        SELECT 
          '단독/다가구' as house_type_name,
          COUNT(*) as total_contracts,
          COUNT(DISTINCT sgg_cd) as districts_count,
          COUNT(DISTINCT umd_nm) as dongs_count,
          AVG(deposit) as avg_deposit,
          AVG(monthly_rent) as avg_monthly_rent,
          MIN(deal_year) as earliest_year,
          MAX(deal_year) as latest_year
        FROM house_rent_contracts
        
        UNION ALL
        
        SELECT 
          '아파트' as house_type_name,
          COUNT(*) as total_contracts,
          COUNT(DISTINCT sgg_cd) as districts_count,
          COUNT(DISTINCT umd_nm) as dongs_count,
          AVG(deposit) as avg_deposit,
          AVG(monthly_rent) as avg_monthly_rent,
          MIN(deal_year) as earliest_year,
          MAX(deal_year) as latest_year
        FROM house_rent_contracts_apt
        
        UNION ALL
        
        SELECT 
          '연립/다세대' as house_type_name,
          COUNT(*) as total_contracts,
          COUNT(DISTINCT sgg_cd) as districts_count,
          COUNT(DISTINCT umd_nm) as dongs_count,
          AVG(deposit) as avg_deposit,
          AVG(monthly_rent) as avg_monthly_rent,
          MIN(deal_year) as earliest_year,
          MAX(deal_year) as latest_year
        FROM house_rent_contracts_more
        
        UNION ALL
        
        SELECT 
          '오피스텔' as house_type_name,
          COUNT(*) as total_contracts,
          COUNT(DISTINCT sgg_cd) as districts_count,
          COUNT(DISTINCT umd_nm) as dongs_count,
          AVG(deposit) as avg_deposit,
          AVG(monthly_rent) as avg_monthly_rent,
          MIN(deal_year) as earliest_year,
          MAX(deal_year) as latest_year
        FROM house_rent_contracts_opp
      )
      SELECT * FROM house_type_stats
      ORDER BY total_contracts DESC
    `;
    
    const result = await pool.query(query);
    console.log('주택 유형별 통계 결과:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('주택 유형별 통계 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 모든 라우트를 React 앱으로 리다이렉트 (SPA 지원)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 서버 시작
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
