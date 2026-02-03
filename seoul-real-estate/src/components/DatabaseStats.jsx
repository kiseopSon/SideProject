import React, { useState, useEffect } from 'react';
import './DatabaseStats.css';

// 서울시 구별 코드 매핑
const SEOUL_DISTRICT_CODES = {
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
};

// 모의 데이터
const mockDistrictStats = [
  { sgg_cd: "11110", total_contracts: 1250, unique_dongs: 15 },
  { sgg_cd: "11140", total_contracts: 980, unique_dongs: 12 },
  { sgg_cd: "11215", total_contracts: 1450, unique_dongs: 18 },
  { sgg_cd: "11230", total_contracts: 1100, unique_dongs: 14 },
  { sgg_cd: "11260", total_contracts: 1350, unique_dongs: 16 },
  { sgg_cd: "11305", total_contracts: 1200, unique_dongs: 15 },
  { sgg_cd: "11320", total_contracts: 950, unique_dongs: 12 },
  { sgg_cd: "11350", total_contracts: 1400, unique_dongs: 17 },
  { sgg_cd: "11380", total_contracts: 1300, unique_dongs: 16 },
  { sgg_cd: "11410", total_contracts: 1150, unique_dongs: 14 },
  { sgg_cd: "11440", total_contracts: 1600, unique_dongs: 19 },
  { sgg_cd: "11470", total_contracts: 1250, unique_dongs: 15 },
  { sgg_cd: "11500", total_contracts: 1100, unique_dongs: 13 },
  { sgg_cd: "11530", total_contracts: 1350, unique_dongs: 16 },
  { sgg_cd: "11545", total_contracts: 1200, unique_dongs: 14 },
  { sgg_cd: "11560", total_contracts: 1500, unique_dongs: 18 },
  { sgg_cd: "11590", total_contracts: 1300, unique_dongs: 16 },
  { sgg_cd: "11620", total_contracts: 1400, unique_dongs: 17 },
  { sgg_cd: "11650", total_contracts: 1800, unique_dongs: 20 },
  { sgg_cd: "11680", total_contracts: 2200, unique_dongs: 22 },
  { sgg_cd: "11710", total_contracts: 1900, unique_dongs: 21 },
  { sgg_cd: "11740", total_contracts: 1600, unique_dongs: 18 }
];

const mockDongStats = [
  { sgg_cd: "11680", umd_nm: "역삼동", contract_count: 450 },
  { sgg_cd: "11680", umd_nm: "삼성동", contract_count: 380 },
  { sgg_cd: "11680", umd_nm: "청담동", contract_count: 320 },
  { sgg_cd: "11650", umd_nm: "서초동", contract_count: 420 },
  { sgg_cd: "11650", umd_nm: "반포동", contract_count: 380 },
  { sgg_cd: "11710", umd_nm: "송파동", contract_count: 350 },
  { sgg_cd: "11710", umd_nm: "문정동", contract_count: 280 },
  { sgg_cd: "11440", umd_nm: "홍대입구", contract_count: 400 },
  { sgg_cd: "11440", umd_nm: "합정동", contract_count: 320 },
  { sgg_cd: "11560", umd_nm: "여의도동", contract_count: 450 },
  { sgg_cd: "11560", umd_nm: "당산동", contract_count: 380 },
  { sgg_cd: "11110", umd_nm: "종로1가", contract_count: 280 },
  { sgg_cd: "11110", umd_nm: "종로2가", contract_count: 250 },
  { sgg_cd: "11140", umd_nm: "중림동", contract_count: 200 },
  { sgg_cd: "11140", umd_nm: "황학동", contract_count: 180 }
];

// 코드로 지역명 찾기
function getDistrictName(districtCode) {
  for (const [name, code] of Object.entries(SEOUL_DISTRICT_CODES)) {
    if (code === districtCode) {
      return name;
    }
  }
  return '알 수 없음';
}

// 지역별 통계 조회
async function getDistrictStatistics() {
  try {
    const response = await fetch('http://localhost:3000/api/statistics/districts');
    if (!response.ok) {
      throw new Error('지역별 통계를 불러올 수 없습니다.');
    }
    return await response.json();
  } catch (error) {
    console.error('지역별 통계 조회 오류:', error);
    throw error;
  }
}

// 동별 통계 조회
async function getDongStatistics() {
  try {
    const response = await fetch('http://localhost:3000/api/statistics/dongs');
    if (!response.ok) {
      throw new Error('동별 통계를 불러올 수 없습니다.');
    }
    return await response.json();
  } catch (error) {
    console.error('동별 통계 조회 오류:', error);
    throw error;
  }
}

// 전체 통계 요약
async function getOverallStatistics() {
  try {
    const response = await fetch('http://localhost:3000/api/statistics/overall');
    if (!response.ok) {
      throw new Error('전체 통계를 불러올 수 없습니다.');
    }
    return await response.json();
  } catch (error) {
    console.error('전체 통계 조회 오류:', error);
    throw error;
  }
}

// 주택 유형별 통계 조회
async function getHouseTypeStatistics() {
  try {
    const response = await fetch('http://localhost:3000/api/statistics/house-types');
    if (!response.ok) {
      throw new Error('주택 유형별 통계를 불러올 수 없습니다.');
    }
    return await response.json();
  } catch (error) {
    console.error('주택 유형별 통계 조회 오류:', error);
    throw error;
  }
}

// 동별 상세 계약 정보 조회
async function getDongContractDetails(sgg_cd, umd_nm) {
  try {
    const response = await fetch(`http://localhost:3000/api/contracts/dong/${sgg_cd}/${encodeURIComponent(umd_nm)}`);
    if (!response.ok) {
      throw new Error('상세 계약 정보를 불러올 수 없습니다.');
    }
    return await response.json();
  } catch (error) {
    console.error('동별 상세 계약 정보 조회 오류:', error);
    throw error;
  }
}

const DatabaseStats = () => {
  const [districtStats, setDistrictStats] = useState([]);
  const [dongStats, setDongStats] = useState([]);
  const [overallStats, setOverallStats] = useState(null);
  const [houseTypeStats, setHouseTypeStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'count', 'avg'
  const [dongSearchTerm, setDongSearchTerm] = useState(''); // 동별 검색용
  
  // 상세 계약 정보 모달 상태
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedDong, setSelectedDong] = useState(null);
  const [contractDetails, setContractDetails] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  
  // 상세 계약 정보 검색 및 필터 상태
  const [contractSearchTerm, setContractSearchTerm] = useState('');
  const [contractFilterType, setContractFilterType] = useState('all'); // 'all', 'apartment', 'villa', 'house'
  const [contractSortBy, setContractSortBy] = useState('date'); // 'date', 'deposit', 'rent', 'area'
  const [contractFilterYear, setContractFilterYear] = useState('all'); // 'all', '25', '26', '27'
  const [contractFilterMonth, setContractFilterMonth] = useState('all'); // 'all', '1', '2', ..., '12'

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('데이터 로딩 시작...');

      const [districtData, dongData, overallData, houseTypeData] = await Promise.all([
        getDistrictStatistics(),
        getDongStatistics(),
        getOverallStatistics(),
        getHouseTypeStatistics()
      ]);

      console.log('지역별 데이터:', districtData);
      console.log('동별 데이터:', dongData);
      console.log('전체 데이터:', overallData);
      console.log('주택 유형별 데이터:', houseTypeData);

      setDistrictStats(districtData);
      setDongStats(dongData);
      setOverallStats(overallData);
      setHouseTypeStats(houseTypeData);
    } catch (err) {
      console.error('데이터 로딩 오류:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 구별 통계 데이터
  const filteredDistrictStats = districtStats.filter(stat => {
    const districtName = getDistrictName(stat.sgg_cd);
    return districtName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           stat.sgg_cd.includes(searchTerm);
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return getDistrictName(a.sgg_cd).localeCompare(getDistrictName(b.sgg_cd));
      case 'count':
        return b.total_contracts - a.total_contracts;
      case 'avg':
        return (b.total_contracts / b.unique_dongs) - (a.total_contracts / a.unique_dongs);
      default:
        return 0;
    }
  });

  // 필터링된 동별 통계 데이터
  const filteredDongStats = dongStats.filter(stat => {
    const districtName = getDistrictName(stat.sgg_cd);
    
    // 동별 검색 조건 (dongSearchTerm 사용)
    const matchesDongSearch = dongSearchTerm === '' || 
      stat.umd_nm.toLowerCase().includes(dongSearchTerm.toLowerCase());
    
    // 일반 검색 조건 (searchTerm 사용)
    const matchesGeneralSearch = searchTerm === '' || 
      districtName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stat.umd_nm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stat.sgg_cd.includes(searchTerm);
    
    // 구별 필터 조건
    const matchesDistrict = selectedDistrict === 'all' || stat.sgg_cd === selectedDistrict;
    
    return matchesDongSearch && matchesGeneralSearch && matchesDistrict;
  }).sort((a, b) => b.contract_count - a.contract_count);

  // 필터링된 상세 계약 정보
  const filteredContractDetails = contractDetails.filter(contract => {
    const matchesSearch = contractSearchTerm === '' || 
      contract.house_type_name?.toLowerCase().includes(contractSearchTerm.toLowerCase()) ||
      contract.house_type?.toLowerCase().includes(contractSearchTerm.toLowerCase()) ||
      contract.building_name?.toLowerCase().includes(contractSearchTerm.toLowerCase()) ||
      contract.contract_type?.toLowerCase().includes(contractSearchTerm.toLowerCase()) ||
      contract.deposit?.toString().includes(contractSearchTerm) ||
      contract.monthly_rent?.toString().includes(contractSearchTerm) ||
      contract.floor_area?.toString().includes(contractSearchTerm) ||
      contract.floor?.toString().includes(contractSearchTerm) ||
      contract.build_year?.toString().includes(contractSearchTerm) ||
      contract.contract_term?.includes(contractSearchTerm);
    
    // 주택 유형별 필터링 로직 (house_type이 null인 경우와 아닌 경우 구분)
    let matchesFilter = false;
    if (contractFilterType === 'all') {
      matchesFilter = true;
    } else if (contractFilterType === 'apartment') {
      // 아파트: house_type이 null이고 house_type_name이 '아파트'
      matchesFilter = contract.house_type === null && contract.house_type_name === '아파트';
    } else if (contractFilterType === 'officetel') {
      // 오피스텔: house_type_name이 '오피스텔'이거나 house_type이 '오피스텔'
      matchesFilter = contract.house_type_name === '오피스텔' || contract.house_type === '오피스텔';
    } else if (contractFilterType === 'rowhouse') {
      matchesFilter = contract.house_type_name === '연립/다세대' || contract.house_type?.includes('연립');
    } else if (contractFilterType === 'multifamily') {
      matchesFilter = contract.house_type_name === '연립/다세대' || contract.house_type?.includes('다세대');
    } else if (contractFilterType === 'house') {
      matchesFilter = contract.house_type_name === '단독/다가구' || contract.house_type?.includes('단독');
    } else if (contractFilterType === 'multi') {
      matchesFilter = contract.house_type_name === '단독/다가구' || contract.house_type?.includes('다가구');
    }
    
    // 아파트/오피스텔 디버깅 로그
    if (contractFilterType === 'apartment' || contractFilterType === 'officetel') {
      console.log(`${contractFilterType} 필터 체크:`, {
        house_type_name: contract.house_type_name,
        house_type: contract.house_type,
        is_null: contract.house_type === null,
        matches_name: contract.house_type_name === (contractFilterType === 'apartment' ? '아파트' : '오피스텔'),
        final_match: matchesFilter
      });
    }
    
    // 계약기간 년도 필터링
    const matchesYear = contractFilterYear === 'all' || 
      (contract.contract_term && (() => {
        const parts = contract.contract_term.split('~');
        if (parts.length >= 2) {
          const startDate = parts[0].trim(); // "25.09" 부분 추출
          const startYear = startDate.split('.')[0]; // "25" 부분 추출
          return startYear === contractFilterYear;
        }
        return false;
      })());
    
    // 월별 필터링 (계약일순일 때만 적용)
    const matchesMonth = contractSortBy !== 'date' || contractFilterMonth === 'all' || 
      contract.deal_month.toString() === contractFilterMonth;
    
    return matchesSearch && matchesFilter && matchesYear && matchesMonth;
  }).sort((a, b) => {
    switch (contractSortBy) {
      case 'date':
        return new Date(b.deal_year, b.deal_month - 1, b.deal_day) - new Date(a.deal_year, a.deal_month - 1, a.deal_day);
      case 'deposit':
        return (b.deposit || 0) - (a.deposit || 0);
      case 'rent':
        return (b.monthly_rent || 0) - (a.monthly_rent || 0);
      case 'area':
        return (b.floor_area || 0) - (a.floor_area || 0);
      default:
        return 0;
    }
  });

  // 구별 필터 옵션 (검색어로 필터링)
  const districtOptions = [
    { value: 'all', label: '전체 구' },
    ...districtStats
      .filter(stat => {
        const districtName = getDistrictName(stat.sgg_cd);
        return districtName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               stat.sgg_cd.includes(searchTerm);
      })
      .map(stat => ({
        value: stat.sgg_cd,
        label: getDistrictName(stat.sgg_cd)
      }))
  ];

  // 주택 유형 필터 옵션
  const houseTypeOptions = [
    { value: 'all', label: '전체 유형' },
    { value: 'apartment', label: '아파트' },
    { value: 'officetel', label: '오피스텔' },
    { value: 'rowhouse', label: '연립' },
    { value: 'multifamily', label: '다세대' },
    { value: 'house', label: '단독주택' },
    { value: 'multi', label: '다가구' }
  ];

  // 정렬 옵션
  const sortOptions = [
    { value: 'date', label: '계약일순' },
    { value: 'deposit', label: '보증금순' },
    { value: 'rent', label: '월세순' },
    { value: 'area', label: '면적순' }
  ];

  // 계약기간 년도 필터 옵션
  const yearOptions = [
    { value: 'all', label: '전체 계약 기간' },
    { value: '25', label: '2025년' },
    { value: '26', label: '2026년' },
    { value: '27', label: '2027년' }
  ];

  // 월별 필터 옵션
  const monthOptions = [
    { value: 'all', label: '전체 월' },
    { value: '1', label: '1월' },
    { value: '2', label: '2월' },
    { value: '3', label: '3월' },
    { value: '4', label: '4월' },
    { value: '5', label: '5월' },
    { value: '6', label: '6월' },
    { value: '7', label: '7월' },
    { value: '8', label: '8월' },
    { value: '9', label: '9월' },
    { value: '10', label: '10월' },
    { value: '11', label: '11월' },
    { value: '12', label: '12월' }
  ];

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDistrict('all');
    setSortBy('name');
    setDongSearchTerm('');
  };

  // 동별 행 클릭 핸들러
  const handleDongRowClick = async (dong) => {
    try {
      setLoadingContracts(true);
      setSelectedDong(dong);
      setShowContractModal(true);
      
      console.log('상세 정보 요청:', { sgg_cd: dong.sgg_cd, umd_nm: dong.umd_nm });
      
      const details = await getDongContractDetails(dong.sgg_cd, dong.umd_nm);
      console.log('받은 상세 정보:', details);
      
      // 주택 유형별 통계 확인
      const typeStats = {};
      details.forEach(contract => {
        const type = contract.house_type_name || 'unknown';
        typeStats[type] = (typeStats[type] || 0) + 1;
      });
      console.log('주택 유형별 통계:', typeStats);
      
      setContractDetails(details);
    } catch (error) {
      console.error('상세 정보 로딩 오류:', error);
      console.error('오류 상세:', {
        message: error.message,
        stack: error.stack,
        dong: dong
      });
      alert(`상세 정보를 불러오는 중 오류가 발생했습니다.\n\n오류: ${error.message}`);
    } finally {
      setLoadingContracts(false);
    }
  };

  // 모달 닫기
  const closeModal = () => {
    setShowContractModal(false);
    setSelectedDong(null);
    setContractDetails([]);
    setContractSearchTerm('');
    setContractFilterType('all');
    setContractSortBy('date');
    setContractFilterYear('all');
    setContractFilterMonth('all');
  };

  if (loading) {
    return (
      <div className="database-stats">
        <div className="loading">데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="database-stats">
        <div className="error">
          <h3>오류 발생</h3>
          <p>{error}</p>
          <button onClick={loadStatistics} className="retry-btn">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="database-stats">
      <h2>서울시 부동산 데이터 통계</h2>
      
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          전체 요약
        </button>
        <button 
          className={`tab-btn ${activeTab === 'districts' ? 'active' : ''}`}
          onClick={() => setActiveTab('districts')}
        >
          구별 통계
        </button>
        <button 
          className={`tab-btn ${activeTab === 'dongs' ? 'active' : ''}`}
          onClick={() => setActiveTab('dongs')}
        >
          동별 통계
        </button>
        <button 
          className={`tab-btn ${activeTab === 'house-types' ? 'active' : ''}`}
          onClick={() => setActiveTab('house-types')}
        >
          주택 유형별 통계
        </button>
      </div>

      <div className="tab-content">
        {/* 검색 및 필터 UI */}
        {(activeTab === 'districts' || activeTab === 'dongs') && (
          <div className="search-filter-container">
            <div className="search-box">
              <input
                type="text"
                placeholder="구명, 동명, 지역코드로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
            
                         {activeTab === 'dongs' && (
               <div className="filter-box">
                 <input
                   type="text"
                   placeholder="동명으로 검색..."
                   value={dongSearchTerm}
                   onChange={(e) => setDongSearchTerm(e.target.value)}
                   className="dong-search-input"
                 />
               </div>
             )}
             
             {activeTab === 'dongs' && (
               <div className="filter-box">
                 <select
                   value={selectedDistrict}
                   onChange={(e) => setSelectedDistrict(e.target.value)}
                   className="district-filter"
                 >
                   {districtOptions.map(option => (
                     <option key={option.value} value={option.value}>
                       {option.label}
                     </option>
                   ))}
                 </select>
               </div>
             )}
            
            {activeTab === 'districts' && (
              <div className="filter-box">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-filter"
                >
                  <option value="name">구명순</option>
                  <option value="count">계약건수순</option>
                  <option value="avg">평균계약순</option>
                </select>
              </div>
            )}
            
            <button onClick={clearFilters} className="clear-filters-btn">
              필터 초기화
            </button>
          </div>
        )}

        {/* 검색 결과 요약 */}
        {(activeTab === 'districts' || activeTab === 'dongs') && (searchTerm || (activeTab === 'dongs' && dongSearchTerm)) && (
          <div className="search-summary">
            <p>
              {activeTab === 'districts' 
                ? `"${searchTerm}" 검색 결과: ${filteredDistrictStats.length}개 구`
                : `"${searchTerm || ''}" ${dongSearchTerm ? `+ "${dongSearchTerm}" 동별 검색` : ''} 결과: ${filteredDongStats.length}개 동`
              }
            </p>
          </div>
        )}
        {activeTab === 'overview' && overallStats && (
          <div className="overview-stats">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>총 계약 건수</h3>
                <div className="stat-value">{overallStats.total_contracts.toLocaleString()}</div>
              </div>
              <div className="stat-card">
                <h3>총 구 수</h3>
                <div className="stat-value">{overallStats.total_districts}</div>
              </div>
              <div className="stat-card">
                <h3>총 동 수</h3>
                <div className="stat-value">{overallStats.total_dongs}</div>
              </div>
              <div className="stat-card">
                <h3>주택 유형 수</h3>
                <div className="stat-value">{overallStats.total_house_types || 4}</div>
              </div>
              <div className="stat-card">
                <h3>데이터 기간</h3>
                <div className="stat-value">{overallStats.earliest_year} ~ {overallStats.latest_year}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'districts' && (
          <div className="district-stats">
            {filteredDistrictStats.length > 0 ? (
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>구명</th>
                    <th>지역코드</th>
                    <th>총 계약 건수</th>
                    <th>동 수</th>
                    <th>평균 계약/동</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDistrictStats.map((stat, index) => (
                    <tr key={index}>
                      <td>{getDistrictName(stat.sgg_cd)}</td>
                      <td>{stat.sgg_cd}</td>
                      <td>{stat.total_contracts.toLocaleString()}</td>
                      <td>{stat.unique_dongs}</td>
                      <td>{Math.round(stat.total_contracts / stat.unique_dongs).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data">
                {searchTerm ? `"${searchTerm}"에 대한 검색 결과가 없습니다.` : '데이터가 없습니다.'}
              </div>
            )}
          </div>
        )}

        {activeTab === 'dongs' && (
          <div className="dong-stats">
            {filteredDongStats.length > 0 ? (
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>구명</th>
                    <th>동명</th>
                    <th>계약 건수</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDongStats.map((stat, index) => (
                    <tr key={index} onClick={() => handleDongRowClick(stat)} className="clickable-row">
                      <td>{getDistrictName(stat.sgg_cd)}</td>
                      <td>{stat.umd_nm}</td>
                      <td>{stat.contract_count.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data">
                {searchTerm || selectedDistrict !== 'all' 
                  ? '검색 조건에 맞는 결과가 없습니다.' 
                  : '데이터가 없습니다.'
                }
              </div>
            )}
          </div>
        )}

        {/* 주택 유형별 통계 탭 */}
        {activeTab === 'house-types' && (
          <div className="house-types-tab">
            <div className="stats-summary">
              <h3>주택 유형별 통계</h3>
              <p>서울시 전체 주택 유형별 계약 현황을 확인할 수 있습니다.</p>
            </div>

            {houseTypeStats.length > 0 ? (
              <div className="house-types-grid">
                {houseTypeStats.map((stat, index) => (
                  <div key={index} className="house-type-card">
                    <div className="house-type-header">
                      <h4>{stat.house_type_name}</h4>
                      <div className="house-type-icon">
                        {stat.house_type_name === '아파트' && '🏢'}
                        {stat.house_type_name === '단독/다가구' && '🏠'}
                        {stat.house_type_name === '연립/다세대' && '🏘️'}
                        {stat.house_type_name === '오피스텔' && '🏬'}
                      </div>
                    </div>
                    
                    <div className="house-type-stats">
                      <div className="stat-item">
                        <span className="stat-label">총 계약 건수</span>
                        <span className="stat-value">{stat.total_contracts.toLocaleString()}건</span>
                      </div>
                      
                      <div className="stat-item">
                        <span className="stat-label">지역 수</span>
                        <span className="stat-value">{stat.districts_count}개 구</span>
                      </div>
                      
                      <div className="stat-item">
                        <span className="stat-label">동 수</span>
                        <span className="stat-value">{stat.dongs_count}개 동</span>
                      </div>
                      
                      <div className="stat-item">
                        <span className="stat-label">평균 보증금</span>
                        <span className="stat-value">
                          {stat.avg_deposit ? `${Math.round(stat.avg_deposit).toLocaleString()}만원` : '-'}
                        </span>
                      </div>
                      
                      <div className="stat-item">
                        <span className="stat-label">평균 월세</span>
                        <span className="stat-value">
                          {stat.avg_monthly_rent ? `${Math.round(stat.avg_monthly_rent).toLocaleString()}만원` : '-'}
                        </span>
                      </div>
                      
                      <div className="stat-item">
                        <span className="stat-label">데이터 기간</span>
                        <span className="stat-value">
                          {stat.earliest_year && stat.latest_year 
                            ? `${stat.earliest_year}년 ~ ${stat.latest_year}년`
                            : '-'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">주택 유형별 통계 데이터가 없습니다.</div>
            )}
          </div>
        )}
      </div>
      
      {/* 상세 계약 정보 모달 */}
      {showContractModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {selectedDong && `${getDistrictName(selectedDong.sgg_cd)} ${selectedDong.umd_nm} `} 
                 상세 계약 정보
              </h3>
              <button onClick={closeModal} className="modal-close-btn">×</button>
            </div>
            
            <div className="modal-body">
              {loadingContracts ? (
                <div className="loading">상세 정보를 불러오는 중...</div>
              ) : contractDetails.length > 0 ? (
                <div className="contract-details">
                  <div className="contract-summary">
                    <p>총 {contractDetails.length}건의 계약 정보</p>
                  </div>
                  
                  {/* 상세 계약 정보 검색 및 필터 UI */}
                  <div className="contract-search-filter-container">
                    <div className="contract-search-box">
                      <input
                        type="text"
                        placeholder="주택유형, 계약유형, 보증금, 월세, 면적, 건축년도로 검색..."
                        value={contractSearchTerm}
                        onChange={(e) => setContractSearchTerm(e.target.value)}
                        className="contract-search-input"
                      />
                      <span className="contract-search-icon">🔍</span>
                    </div>
                    
                    <div className="contract-filter-box">
                      <select
                        value={contractFilterType}
                        onChange={(e) => setContractFilterType(e.target.value)}
                        className="contract-type-filter"
                      >
                        {houseTypeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                                         <div className="contract-filter-box">
                       <select
                         value={contractSortBy}
                         onChange={(e) => setContractSortBy(e.target.value)}
                         className="contract-sort-filter"
                       >
                         {sortOptions.map(option => (
                           <option key={option.value} value={option.value}>
                             {option.label}
                           </option>
                         ))}
                       </select>
                     </div>
                     
                     <div className="contract-filter-box">
                       <select
                         value={contractFilterYear}
                         onChange={(e) => setContractFilterYear(e.target.value)}
                         className="contract-year-filter"
                       >
                         {yearOptions.map(option => (
                           <option key={option.value} value={option.value}>
                             {option.label}
                           </option>
                         ))}
                       </select>
                     </div>
                     
                     {contractSortBy === 'date' && (
                       <div className="contract-filter-box">
                         <select
                           value={contractFilterMonth}
                           onChange={(e) => setContractFilterMonth(e.target.value)}
                           className="contract-month-filter"
                         >
                           {monthOptions.map(option => (
                             <option key={option.value} value={option.value}>
                               {option.label}
                             </option>
                           ))}
                         </select>
                       </div>
                     )}
                    
                                         <button 
                       onClick={() => {
                         setContractSearchTerm('');
                         setContractFilterType('all');
                         setContractSortBy('date');
                         setContractFilterYear('all');
                         setContractFilterMonth('all');
                       }} 
                       className="contract-clear-filters-btn"
                     >
                       필터 초기화
                     </button>
                  </div>

                                     {/* 검색 결과 요약 */}
                   {(contractSearchTerm || contractFilterType !== 'all' || contractFilterYear !== 'all' || contractFilterMonth !== 'all') && (
                     <div className="contract-search-summary">
                       <p>
                         {contractSearchTerm && contractFilterType !== 'all' && contractFilterYear !== 'all'
                           ? `"${contractSearchTerm}" 검색 + ${houseTypeOptions.find(opt => opt.value === contractFilterType)?.label} + ${yearOptions.find(opt => opt.value === contractFilterYear)?.label} 결과: ${filteredContractDetails.length}건`
                           : contractSearchTerm && contractFilterType !== 'all'
                           ? `"${contractSearchTerm}" 검색 + ${houseTypeOptions.find(opt => opt.value === contractFilterType)?.label} 결과: ${filteredContractDetails.length}건`
                           : contractSearchTerm && contractFilterYear !== 'all'
                           ? `"${contractSearchTerm}" 검색 + ${yearOptions.find(opt => opt.value === contractFilterYear)?.label} 결과: ${filteredContractDetails.length}건`
                           : contractFilterType !== 'all' && contractFilterYear !== 'all'
                           ? `${houseTypeOptions.find(opt => opt.value === contractFilterType)?.label} + ${yearOptions.find(opt => opt.value === contractFilterYear)?.label} 결과: ${filteredContractDetails.length}건`
                           : contractSearchTerm
                           ? `"${contractSearchTerm}" 검색 결과: ${filteredContractDetails.length}건`
                           : contractFilterType !== 'all'
                           ? `${houseTypeOptions.find(opt => opt.value === contractFilterType)?.label} 결과: ${filteredContractDetails.length}건`
                           : `${yearOptions.find(opt => opt.value === contractFilterYear)?.label} 결과: ${filteredContractDetails.length}건`
                         }
                       </p>
                     </div>
                   )}
                  
                  <div className="contract-table-container">
                    <table className="contract-table">
                      <thead>
                        <tr>
                          <th>계약일</th>
                          <th>주택유형</th>
                          <th>건물명</th>
                          <th>층수</th>
                          <th>면적(㎡)</th>
                          <th>보증금</th>
                          <th>월세</th>
                          <th>건축년도</th>
                          <th>계약기간</th>
                          <th>계약유형</th>
                          <th>이전보증금</th>
                          <th>이전월세</th>
                        </tr>
                      </thead>
                      <tbody>
                                                 {filteredContractDetails.map((contract, index) => (
                           <tr key={index}>
                             <td>{`${contract.deal_year}-${String(contract.deal_month).padStart(2, '0')}-${String(contract.deal_day).padStart(2, '0')}`}</td>
                             <td>{contract.house_type_name || contract.house_type || '-'}</td>
                             <td>{contract.building_name || '-'}</td>
                             <td>{contract.floor || '-'}</td>
                             <td>{contract.floor_area ? `${contract.floor_area}㎡` : '-'}</td>
                             <td>{contract.deposit ? `${contract.deposit.toLocaleString()}만원` : '-'}</td>
                             <td>{contract.monthly_rent ? `${contract.monthly_rent.toLocaleString()}만원` : '-'}</td>
                             <td>{contract.build_year || '-'}</td>
                             <td>
                               {contract.contract_term ? (
                                 <div className="contract-term-display">
                                   {contract.contract_term.split('~').map((part, i) => (
                                     <span key={i} className={`contract-year ${i === 0 ? 'start-year' : 'end-year'}`}>
                                       {part.trim()}
                                     </span>
                                   ))}
                                 </div>
                               ) : '-'}
                             </td>
                             <td>{contract.contract_type || '-'}</td>
                             <td>{contract.pre_deposit ? `${contract.pre_deposit.toLocaleString()}만원` : '-'}</td>
                             <td>{contract.pre_monthly_rent ? `${contract.pre_monthly_rent.toLocaleString()}만원` : '-'}</td>
                           </tr>
                         ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="no-data">상세 계약 정보가 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseStats;
