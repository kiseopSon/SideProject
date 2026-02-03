import React, { useState, useEffect, useRef } from 'react';
import './SeoulOverviewMap.css';

// 서울시 실제 지리 좌표 (경도, 위도 기반)
const seoulDistrictCoordinates = {
  '강남구': { lng: 127.0476, lat: 37.5172, color: '#FF6B6B' },
  '강동구': { lng: 127.1468, lat: 37.5301, color: '#4ECDC4' },
  '강북구': { lng: 127.0104, lat: 37.6396, color: '#45B7D1' },
  '강서구': { lng: 126.8495, lat: 37.5509, color: '#96CEB4' },
  '관악구': { lng: 126.9515, lat: 37.4784, color: '#FFEAA7' },
  '광진구': { lng: 127.0822, lat: 37.5384, color: '#DDA0DD' },
  '구로구': { lng: 126.8874, lat: 37.4954, color: '#98D8C8' },
  '금천구': { lng: 126.9027, lat: 37.4602, color: '#F7DC6F' },
  '노원구': { lng: 127.0568, lat: 37.6542, color: '#BB8FCE' },
  '도봉구': { lng: 127.0326, lat: 37.6688, color: '#85C1E9' },
  '동대문구': { lng: 127.0422, lat: 37.5744, color: '#F8C471' },
  '동작구': { lng: 126.9364, lat: 37.5124, color: '#82E0AA' },
  '마포구': { lng: 126.9086, lat: 37.5636, color: '#F1948A' },
  '서대문구': { lng: 126.9368, lat: 37.5791, color: '#85C1E9' },
  '서초구': { lng: 127.0324, lat: 37.4837, color: '#F7DC6F' },
  '성동구': { lng: 127.0470, lat: 37.5506, color: '#D7BDE2' },
  '성북구': { lng: 127.0168, lat: 37.5894, color: '#A9CCE3' },
  '송파구': { lng: 127.1058, lat: 37.5145, color: '#FAD7A0' },
  '양천구': { lng: 126.8664, lat: 37.5270, color: '#ABEBC6' },
  '영등포구': { lng: 126.9074, lat: 37.5264, color: '#F9E79F' },
  '용산구': { lng: 126.9654, lat: 37.5324, color: '#D5A6BD' },
  '은평구': { lng: 126.9308, lat: 37.6026, color: '#AED6F1' },
  '종로구': { lng: 126.9786, lat: 37.5737, color: '#F8C471' },
  '중구': { lng: 126.9979, lat: 37.5641, color: '#F1948A' },
  '중랑구': { lng: 127.0928, lat: 37.6060, color: '#85C1E9' }
};

// 지리 좌표를 화면 좌표로 변환하는 함수
const transformToScreenCoordinates = (geoCoords, containerWidth, containerHeight) => {
  const width = containerWidth || 800;
  const height = containerHeight || 400;
  
  // 모바일 감지
  const isMobile = window.innerWidth <= 768;
  
  // 서울시 경계 (실제 지리 좌표)
  const seoulBounds = {
    minLng: 126.6, maxLng: 127.3,
    minLat: 37.3, maxLat: 37.8
  };
  
  // 경도/위도를 0~1 비율로 변환
  const ratioX = (geoCoords.lng - seoulBounds.minLng) / (seoulBounds.maxLng - seoulBounds.minLng);
  const ratioY = (geoCoords.lat - seoulBounds.minLat) / (seoulBounds.maxLat - seoulBounds.minLat);
  
  // 화면 좌표로 변환 - 모바일 대응
  const marginX = Math.min(width, height) * 0.05;
  const marginY = isMobile 
    ? Math.min(width, height) * 0.8 // 모바일에서는 위쪽으로 올리기
    : Math.min(width, height) * 1.35; // 데스크톱에서는 기존
  const availableWidth = width - 2 * marginX;
  const availableHeight = height - 2 * marginY;
  
  const x = marginX + ratioX * availableWidth;
  const y = marginY + (1 - ratioY) * availableHeight;
  
  return { x, y };
};

const SeoulOverviewMap = ({ onDistrictClick, onOpenPriceComparison }) => {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showKakaoMapModal, setShowKakaoMapModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const containerRef = useRef(null);

  const mockProperties = [
    { id: 1, title: '강남역 신축 원룸', price: '800만원', type: '원룸', area: '18평', rooms: '1', floor: '5층', location: '강남구 강남대로', lat: 37.4981, lng: 127.0276 },
    { id: 2, title: '서초구 아파트', price: '12억', type: '아파트', area: '84평', rooms: '3', floor: '12층', location: '서초구 서초대로', lat: 37.4837, lng: 127.0324 },
    { id: 3, title: '마포구 빌라', price: '8억', type: '빌라', area: '45평', rooms: '2', floor: '3층', location: '마포구 홍대로', lat: 37.5636, lng: 126.9086 },
    { id: 4, title: '용산구 오피스텔', price: '6억', type: '오피스텔', area: '32평', rooms: '2', floor: '8층', location: '용산구 한강대로', lat: 37.5324, lng: 126.9654 }
  ];

  // 컨테이너 크기 감지
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        // 모바일 대응을 위한 최소 크기 설정
        const minWidth = Math.max(width, 300);
        const minHeight = Math.max(height, 0); // 모바일에서 더 큰 높이 보장
        
        setContainerSize({ width: minWidth, height: minHeight });
      }
    };

    // 초기 계산
    setTimeout(updateSize, 100);

    // 리사이즈 이벤트 리스너 제거
    // const handleResize = () => {
    //   updateSize();
    // };
    // window.addEventListener('resize', handleResize);
    
    // ResizeObserver 제거
    // const resizeObserver = new ResizeObserver(updateSize);
    // if (containerRef.current) {
    //   resizeObserver.observe(containerRef.current);
    // }

    return () => {
      // window.removeEventListener('resize', handleResize);
      // resizeObserver.disconnect();
    };
  }, []);

  const handleDistrictClick = (district) => {
    setSelectedDistrict(district);
    setShowPropertyModal(true);
  };

  const handlePropertyClick = (property) => {
    setSelectedProperty(property);
    setShowKakaoMapModal(true);
  };

  const handleOpenKakaoMap = () => {
    setShowKakaoMapModal(false);
    
    // 선택된 매물의 위치 정보로 카카오 지도 URL 생성
    if (selectedProperty) {
      // 매물의 위치 정보가 있다면 해당 위치로, 없다면 서울시청으로
      const lat = selectedProperty.lat || 37.5665;
      const lng = selectedProperty.lng || 126.9780;
      
      // 카카오 지도 URL 생성
      const kakaoMapUrl = `https://map.kakao.com/link/map/${selectedProperty.title},${lat},${lng}`;
      
      // 새 탭에서 카카오 지도 열기
      window.open(kakaoMapUrl, '_blank');
    } else {
      // 매물 정보가 없으면 서울시청으로 이동
      const kakaoMapUrl = 'https://map.kakao.com/link/map/서울시청,37.5665,126.9780';
      window.open(kakaoMapUrl, '_blank');
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const filteredProperties = mockProperties.filter(property =>
    property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.price.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="seoul-overview-container">
      {/* 헤더 섹션 */}
      <div className="seoul-overview-header">
        <h2 className="seoul-overview-title">서울시 공사현황을 확인해 보세요.</h2>
        <p className="seoul-overview-subtitle">지역을 클릭하시면 해당 구의 공사현황을 확인할 수 있습니다.</p>
      </div>
      
      {/* 메인 컨텐츠 영역 - 지도를 메인으로 */}
      <div className="seoul-overview-main">
        {/* 서울시 지도 - 메인 컨텐츠 */}
        <div className="seoul-map-main-section">
          <div className="seoul-map-container">
            <h3 className="section-title">📍 서울시 지역별 부동산 현황</h3>
            <div className="seoul-outline">
              <div className="seoul-overview-map" ref={containerRef}>
                <svg 
                  width="100%" 
                  height="100%" 
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* 배경 */}
                  <defs>
                    <radialGradient id="bgGradient" cx="60%" cy="60%" r="60%">
                      <stop offset="0%" stopColor="#f8fafc" stopOpacity="1"/>
                      <stop offset="100%" stopColor="#e2e8f0" stopOpacity="1"/>
                    </radialGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  
                  <rect 
                    width={containerSize.width} 
                    height={containerSize.height} 
                    fill="url(#bgGradient)"
                  />
                  
                  {/* 각 구를 원으로 표시 */}
                  {Object.entries(seoulDistrictCoordinates).map(([district, coordinates]) => {
                    const screenCoords = transformToScreenCoordinates(coordinates, containerSize.width, containerSize.height);
                    
                    // 모바일 감지
                    const isMobile = window.innerWidth <= 768;
                    
                    // 반응형 크기 계산 - 모바일 대응
                    const minSize = Math.min(containerSize.width, containerSize.height);
                    const baseRadius = isMobile 
                      ? Math.max(minSize / 35, 8) // 모바일에서는 더 작게
                      : Math.max(minSize / 20, 12); // 데스크톱에서는 기존 크기
                    const radius = baseRadius;
                    
                    return (
                      <g key={district}>
                        {/* 메인 원 */}
                        <circle
                          cx={screenCoords.x}
                          cy={screenCoords.y}
                          r={radius}
                          fill={coordinates.color}
                          stroke="#fff"
                          strokeWidth="2"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleDistrictClick(district)}
                          onMouseEnter={() => setHoveredDistrict({ ...coordinates, name: district, x: screenCoords.x, y: screenCoords.y })}
                          onMouseLeave={() => setHoveredDistrict(null)}
                        />
                        
                        {/* 구 이름 텍스트 (원 안에) */}
                        <text
                          x={screenCoords.x}
                          y={screenCoords.y + 6}
                          textAnchor="middle"
                          fontSize={isMobile 
                            ? Math.max(10, baseRadius * 0.6) // 모바일에서는 더 작게
                            : Math.max(12, baseRadius * 0.7) // 데스크톱에서는 기존 크기
                          }
                          fill="#000"
                          fontWeight="bold"
                          style={{ pointerEvents: 'none' }}
                        >
                          {district}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                
                             {/* 호버 정보 툴팁 */}
                                               {hoveredDistrict && (
                   <div className="district-tooltip" style={{
                     left: `${transformToScreenCoordinates(hoveredDistrict, containerSize.width, containerSize.height).x}px`,
                    top: `${transformToScreenCoordinates(hoveredDistrict, containerSize.width, containerSize.height).y - 80}px`,
                    transform: 'translateX(-50%)',
                    position: 'absolute',
                     zIndex: 9999,
                     pointerEvents: 'none'
                   }}>
                    <div className="tooltip-title">{hoveredDistrict.name}</div>
                   <div className="tooltip-info">
                     <span>매물: 156개</span>
                     <span>평균가: 8억</span>
                   </div>
                   <div className="tooltip-desc">부동산 정보</div>
                 </div>
               )}
            </div>
            
            {/* 지도 하단 정보 */}
            <div className="map-info-panel">
              <div className="map-stats">
                <div className="map-stat-item">
                  <span className="stat-number">25</span>
                  <span className="stat-text">자치구</span>
                </div>
                <div className="map-stat-item">
                  <span className="stat-number">605.2㎢</span>
                  <span className="stat-text">면적</span>
                </div>
                <div className="map-stat-item">
                  <span className="stat-number">950만+</span>
                  <span className="stat-text">인구</span>
                </div>
                <div className="map-stat-item">
                  <span className="stat-number">한강</span>
                  <span className="stat-text">중심</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 요약 정보 패널 - 사이드바 */}
        <div className={`seoul-summary-panel ${isSummaryExpanded ? 'expanded' : ''}`}>
          <h3 className="section-title">📊 서울시 부동산 요약 정보</h3>
          
          {/* 핵심 통계 */}
          <div className="core-stats">
            <div className="stat-card primary">
              <div className="stat-icon">🏠</div>
              <div className="stat-content">
                <div className="stat-value">2,847</div>
                <div className="stat-label">등록된 매물</div>
              </div>
            </div>
            <div className={`stat-card ${!isSummaryExpanded ? 'mobile-hidden' : ''}`}>
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-value">8.2억</div>
                <div className="stat-label">평균 매매가</div>
              </div>
            </div>
            <div className={`stat-card ${!isSummaryExpanded ? 'mobile-hidden' : ''}`}>
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <div className="stat-value">+2.3%</div>
                <div className="stat-label">전월 대비</div>
              </div>
            </div>
          </div>
          
          {/* 지역별 정보 */}
          <div className={`district-categories ${!isSummaryExpanded ? 'mobile-hidden' : ''}`}>
            <div className="district-category">
              <h4 className="category-title">🏢 비즈니스 중심지</h4>
              <div className="category-districts">
                <span className="district-tag" onClick={() => handleDistrictClick('강남구')}>강남구</span>
                <span className="district-tag" onClick={() => handleDistrictClick('서초구')}>서초구</span>
                <span className="district-tag" onClick={() => handleDistrictClick('송파구')}>송파구</span>
              </div>
            </div>
            
            <div className="district-category">
              <h4 className="category-title">🎨 문화/예술 지역</h4>
              <div className="category-districts">
                <span className="district-tag" onClick={() => handleDistrictClick('마포구')}>마포구</span>
                <span className="district-tag" onClick={() => handleDistrictClick('종로구')}>종로구</span>
                <span className="district-tag" onClick={() => handleDistrictClick('중구')}>중구</span>
              </div>
            </div>
            
            <div className="district-category">
              <h4 className="category-title">🏠 주거 지역</h4>
              <div className="category-districts">
                <span className="district-tag" onClick={() => handleDistrictClick('강동구')}>강동구</span>
                <span className="district-tag" onClick={() => handleDistrictClick('광진구')}>광진구</span>
                <span className="district-tag" onClick={() => handleDistrictClick('성동구')}>성동구</span>
              </div>
            </div>
          </div>
          
          {/* 모바일 펼치기/접기 버튼 */}
          <button 
            className="summary-expand-btn"
            onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
          >
            {isSummaryExpanded ? '접기 ▲' : '펼치기 ▼'}
          </button>
        </div>
      </div>
      
      {/* 추가 정보 섹션 */}
      <div className="seoul-additional-info">
        <div className="info-grid">
          <div className="info-card">
            <h3 className="info-card-title">🏆 인기 지역 TOP 5</h3>
            <div className="ranking-list">
              <div className="ranking-item">
                <span className="ranking-number">1</span>
                <span className="ranking-name">강남구</span>
                <span className="ranking-price">15억</span>
              </div>
              <div className="ranking-item">
                <span className="ranking-number">2</span>
                <span className="ranking-name">서초구</span>
                <span className="ranking-price">12억</span>
              </div>
              <div className="ranking-item">
                <span className="ranking-number">3</span>
                <span className="ranking-name">송파구</span>
                <span className="ranking-price">9억</span>
              </div>
              <div className="ranking-item">
                <span className="ranking-number">4</span>
                <span className="ranking-name">마포구</span>
                <span className="ranking-price">8억</span>
              </div>
              <div className="ranking-item">
                <span className="ranking-number">5</span>
                <span className="ranking-name">용산구</span>
                <span className="ranking-price">10억</span>
              </div>
            </div>
          </div>
          
          <div className="info-card">
            <h3 className="info-card-title">📱 실시간 시장 동향</h3>
            <div className="market-trends">
              <div className="trend-item positive">
                <span className="trend-label">강남구</span>
                <span className="trend-value">+3.2%</span>
              </div>
              <div className="trend-item negative">
                <span className="trend-label">강북구</span>
                <span className="trend-value">-1.1%</span>
              </div>
              <div className="trend-item positive">
                <span className="trend-label">마포구</span>
                <span className="trend-value">+2.8%</span>
              </div>
            </div>
          </div>
          
          <div className="info-card">
            <h3 className="info-card-title">💡 투자 팁</h3>
            <div className="investment-tips">
              <div className="tip-item">
                <span className="tip-icon">💡</span>
                <span className="tip-text">강남권은 IT 업체 밀집으로 장기 투자에 적합</span>
              </div>
              <div className="tip-item">
                <span className="tip-icon">💡</span>
                <span className="tip-text">홍대 인근은 젊은 층 선호로 수익률 높음</span>
              </div>
              <div className="tip-item">
                <span className="tip-icon">💡</span>
                <span className="tip-text">강북권은 가성비 좋은 주거 지역</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 매물 리스트 모달 */}
      {showPropertyModal && (
        <div className="property-modal-overlay" onClick={() => setShowPropertyModal(false)}>
          <div className="property-modal" onClick={(e) => e.stopPropagation()}>
            <div className="property-modal-header">
              <h3>{selectedDistrict} 매물 리스트</h3>
              <button 
                onClick={() => setShowPropertyModal(false)}
                className="modal-close-btn"
              >
                ×
              </button>
            </div>
            
            {/* 검색 기능 */}
            <div className="property-search-section">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="매물명, 지역, 가격, 면적으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="property-search-input"
                />
                {searchTerm && (
                  <button 
                    onClick={clearSearch}
                    className="search-clear-btn"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="search-results-info">
                총 {filteredProperties.length}개의 매물이 검색되었습니다.
              </div>
            </div>
            
            <div className="property-list">
              {filteredProperties.length > 0 ? (
                filteredProperties.map(property => (
                  <div 
                    key={property.id} 
                    className="property-item"
                    onClick={() => handlePropertyClick(property)}
                  >
                    <div className="property-info">
                      <h4>{property.title}</h4>
                      <p className="property-location">{property.location}</p>
                      <div className="property-details">
                        <span>{property.type}</span>
                        <span>{property.area}</span>
                        <span>{property.rooms}룸</span>
                      </div>
                    </div>
                    <div className="property-price">{property.price}</div>
                  </div>
                ))
              ) : (
                <div className="no-results">
                  <div className="no-results-icon">🔍</div>
                  <h4>검색 결과가 없습니다</h4>
                  <p>다른 검색어를 입력해보세요.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 카카오 지도 안내 모달 */}
      {showKakaoMapModal && (
        <div className="kakao-map-modal-overlay" onClick={() => setShowKakaoMapModal(false)}>
          <div className="kakao-map-modal" onClick={(e) => e.stopPropagation()}>
            <div className="kakao-map-modal-content">
              <div className="modal-icon">🗺️</div>
              <h3>카카오 지도로 안내받기</h3>
              <p>선택한 매물의 정확한 위치를 카카오 지도에서 확인하시겠습니까?</p>
              <div className="modal-buttons">
                <button 
                  onClick={handleOpenKakaoMap}
                  className="btn-primary"
                >
                  네, 지도 열기
                </button>
                <button 
                  onClick={() => setShowKakaoMapModal(false)}
                  className="btn-secondary"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeoulOverviewMap;
