import React, { useState, useEffect } from 'react';
import usePropertyStore from '../../stores/propertyStore';
import './PriceComparisonModal.css';

const PriceComparisonModal = ({ isOpen, onClose }) => {
  const { properties } = usePropertyStore();
  const [activeTab, setActiveTab] = useState('comparison');
  const [selectedProperty1, setSelectedProperty1] = useState(null);
  const [selectedProperty2, setSelectedProperty2] = useState(null);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      // 모달이 열려있을 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      // 모달이 닫힐 때 body 스크롤 복원
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 매물 데이터를 표시용으로 변환
  const displayProperties = properties.map(prop => ({
    ...prop,
    title: prop.name || prop.title,
    location: prop.address || prop.location,
    price: formatDisplayPrice(prop.price, prop.type),
    type: getDisplayType(prop.type),
    area: prop.area ? `${prop.area}평` : '정보없음',
    rooms: prop.rooms || '정보없음',
    floor: '정보없음'
  }));

  function formatDisplayPrice(price, type) {
    if (type === 'studio' || type === '원룸') {
      return `${price}만원`;
    }
    return `${price}억`;
  }

  function getDisplayType(type) {
    const typeMap = {
      'apartment': '아파트',
      'villa': '빌라',
      'officetel': '오피스텔',
      'studio': '원룸',
      'commercial': '상가'
    };
    return typeMap[type] || type;
  }

  const getPropertyTypeCount = (type) => {
    return properties.filter(p => p.type === type).length;
  };

  const getAveragePrice = (type) => {
    const typeProperties = properties.filter(p => p.type === type);
    if (typeProperties.length === 0) return 0;
    
    const totalPrice = typeProperties.reduce((sum, p) => {
      return sum + (p.price || 0);
    }, 0);
    
    return typeProperties.length > 0 ? totalPrice / typeProperties.length : 0;
  };

  const formatPrice = (price, type) => {
    if (type === '원룸' || type === 'studio') return `${Math.round(price)}만원`;
    return `${price.toFixed(1)}억`;
  };

  const calculatePriceDifference = (price1, price2) => {
    if (!price1 || !price2) return 0;
    
    console.log('가격 비교:', price1, price2); // 디버깅 로그
    
    let p1, p2;
    
    // 원룸인 경우 (만원 단위)
    if (price1.includes('만원') && price2.includes('만원')) {
      p1 = parseFloat(price1.replace('만원', ''));
      p2 = parseFloat(price2.replace('만원', ''));
      console.log('원룸 비교:', p1, p2); // 디버깅 로그
      return ((p1 - p2) / p2 * 100).toFixed(1);
    }
    
    // 아파트/빌라인 경우 (억 단위)
    if (price1.includes('억') && price2.includes('억')) {
      p1 = parseFloat(price1.replace('억', ''));
      p2 = parseFloat(price2.replace('억', ''));
      console.log('아파트/빌라 비교:', p1, p2); // 디버깅 로그
      return ((p1 - p2) / p2 * 100).toFixed(1);
    }
    
    // 단위가 다른 경우 (억 vs 만원)
    if (price1.includes('억') && price2.includes('만원')) {
      p1 = parseFloat(price1.replace('억', '')) * 10000; // 억을 만원으로 변환
      p2 = parseFloat(price2.replace('만원', ''));
      console.log('억 vs 만원 비교:', p1, p2); // 디버깅 로그
      return ((p1 - p2) / p2 * 100).toFixed(1);
    }
    
    if (price1.includes('만원') && price2.includes('억')) {
      p1 = parseFloat(price1.replace('만원', ''));
      p2 = parseFloat(price2.replace('억', '')) * 10000; // 억을 만원으로 변환
      console.log('만원 vs 억 비교:', p1, p2); // 디버깅 로그
      return ((p1 - p2) / p2 * 100).toFixed(1);
    }
    
    return 0;
  };

  // 매물 선택 상태 변경 시 로그
  useEffect(() => {
    console.log('매물 A 선택됨:', selectedProperty1);
    console.log('매물 B 선택됨:', selectedProperty2);
  }, [selectedProperty1, selectedProperty2]);

  return (
    <div className="price-modal-overlay" onClick={onClose}>
      <div className="price-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="price-modal-header">
          <div className="price-modal-header-content">
            <div className="price-modal-title-section">
              <div className="price-modal-icon">💰</div>
              <div>
                <h2 className="price-modal-title">서울 부동산 가격 비교 분석</h2>
                <p className="price-modal-subtitle">실시간 가격 비교 및 투자 분석</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="price-modal-close-button"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="price-modal-tabs">
          <button
            onClick={() => setActiveTab('comparison')}
            className={`price-tab-button ${activeTab === 'comparison' ? 'active' : ''}`}
          >
            ⚖️ 직접 비교
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`price-tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
          >
            📊 시장 분석
          </button>
          <button
            onClick={() => setActiveTab('investment')}
            className={`price-tab-button ${activeTab === 'investment' ? 'active' : ''}`}
          >
            💡 투자 가이드
          </button>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="price-modal-content">
          {activeTab === 'comparison' && (
            <div className="price-content-section">
              <div className="price-grid">
                {/* 매물 선택 영역 */}
                <div className="price-main-section">
                  <div className="price-card">
                    <h3 className="price-card-title">
                      🏠 매물 A 선택
                    </h3>
                    <div className="price-property-grid">
                      {displayProperties.slice(0, 4).map((property, index) => (
                        <div
                          key={property.id}
                          onClick={() => setSelectedProperty1(property)}
                          className={`price-property-item ${selectedProperty1?.id === property.id ? 'selected' : ''}`}
                        >
                          <div className="price-property-info">
                            <div className="price-property-title">{property.title}</div>
                            <div className="price-property-location">{property.location}</div>
                          </div>
                          <div className="price-property-price">
                            <div className="price-property-price-value">{property.price}</div>
                            <div className="price-property-type">{property.type}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="price-card">
                    <h3 className="price-card-title">
                      🏢 매물 B 선택
                    </h3>
                    <div className="price-property-grid">
                      {displayProperties.slice(4, 8).map((property, index) => (
                        <div
                          key={property.id}
                          onClick={() => setSelectedProperty2(property)}
                          className={`price-property-item ${selectedProperty2?.id === property.id ? 'selected' : ''}`}
                        >
                          <div className="price-property-info">
                            <div className="price-property-title">{property.title}</div>
                            <div className="price-property-location">{property.location}</div>
                          </div>
                          <div className="price-property-price">
                            <div className="price-property-price-value">{property.price}</div>
                            <div className="price-property-type">{property.type}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* 비교 결과 */}
                {selectedProperty1 && selectedProperty2 ? (
                  <div className="price-comparison-result">
                    <h3 className="price-comparison-title">
                      ⚖️ 가격 비교 결과
                    </h3>
                    <div className="price-comparison-grid">
                      <div className="price-comparison-item">
                        <div className="price-comparison-label">매물 A</div>
                        <div className="price-comparison-value">{selectedProperty1.price}</div>
                        <div className="price-comparison-name">{selectedProperty1.title}</div>
                        <div className="price-comparison-type">{selectedProperty1.type}</div>
                      </div>
                      
                      <div className="price-comparison-item">
                        <div className="price-comparison-label">가격 차이</div>
                        <div className={`price-comparison-difference ${
                          calculatePriceDifference(selectedProperty1.price, selectedProperty2.price) > 0 
                            ? 'positive' 
                            : 'negative'
                        }`}>
                          {calculatePriceDifference(selectedProperty1.price, selectedProperty2.price)}%
                        </div>
                        <div className="price-comparison-desc">
                          {calculatePriceDifference(selectedProperty1.price, selectedProperty2.price) > 0 
                            ? '매물 A가 더 비쌈' 
                            : '매물 B가 더 비쌈'}
                        </div>
                      </div>
                      
                      <div className="price-comparison-item">
                        <div className="price-comparison-label">매물 B</div>
                        <div className="price-comparison-value">{selectedProperty2.price}</div>
                        <div className="price-comparison-name">{selectedProperty2.title}</div>
                        <div className="price-comparison-type">{selectedProperty2.type}</div>
                      </div>
                    </div>
                    
                    {/* 추가 비교 정보 */}
                    <div className="price-comparison-details">
                      <div className="comparison-detail-item">
                        <span className="detail-label">면적 비교:</span>
                        <span className="detail-value">
                          {selectedProperty1.area} vs {selectedProperty2.area}
                        </span>
                      </div>
                      <div className="comparison-detail-item">
                        <span className="detail-label">방 개수:</span>
                        <span className="detail-value">
                          {selectedProperty1.rooms} vs {selectedProperty2.rooms}
                        </span>
                      </div>
                      <div className="comparison-detail-item">
                        <span className="detail-label">층수:</span>
                        <span className="detail-value">
                          {selectedProperty1.floor} vs {selectedProperty2.floor}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="price-comparison-result">
                    <h3 className="price-comparison-title">
                      ⚖️ 가격 비교 결과
                    </h3>
                    <div className="price-comparison-placeholder">
                      <div className="price-comparison-placeholder-icon">📋</div>
                      <div className="price-comparison-placeholder-text">
                        위에서 매물 A와 매물 B를 각각 선택해주세요
                      </div>
                      <div className="price-comparison-placeholder-desc">
                        선택한 두 매물의 가격을 비교해드립니다
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="price-content-section">
              <div className="price-analysis-grid">
                <div className="price-analysis-card">
                  <h3 className="price-analysis-title">
                    📊 타입별 가격 분석
                  </h3>
                  <div className="price-analysis-content">
                    <div className="price-analysis-item">
                      <div className="price-analysis-header">
                        <span className="price-analysis-label">원룸</span>
                        <span className="price-analysis-value">
                          {formatPrice(getAveragePrice('studio'), '원룸')}
                        </span>
                      </div>
                      <div className="price-analysis-bar-container">
                        <div className="price-analysis-bar-fill"></div>
                      </div>
                      <div className="price-analysis-count">
                        {getPropertyTypeCount('studio')}개 매물 기준
                      </div>
                    </div>
                    
                    <div className="price-analysis-item">
                      <div className="price-analysis-header">
                        <span className="price-analysis-label">빌라/오피스텔</span>
                        <span className="price-analysis-value">
                          {formatPrice(getAveragePrice('villa'), '빌라/오피스텔')}
                        </span>
                      </div>
                      <div className="price-analysis-bar-container">
                        <div className="price-analysis-bar-fill"></div>
                      </div>
                      <div className="price-analysis-count">
                        {getPropertyTypeCount('villa')}개 매물 기준
                      </div>
                    </div>
                    
                    <div className="price-analysis-item">
                      <div className="price-analysis-header">
                        <span className="price-analysis-label">아파트</span>
                        <span className="price-analysis-value">
                          {formatPrice(getAveragePrice('apartment'), '아파트')}
                        </span>
                      </div>
                      <div className="price-analysis-bar-container">
                        <div className="price-analysis-bar-fill"></div>
                      </div>
                      <div className="price-analysis-count">
                        {getPropertyTypeCount('apartment')}개 매물 기준
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="price-analysis-card">
                  <h3 className="price-analysis-title">
                    🏆 가성비 순위
                  </h3>
                  <div className="price-analysis-content">
                    <div className="price-ranking-item">
                      <span className="price-ranking-rank">1위</span>
                      <span className="price-ranking-type">원룸</span>
                      <span className="price-ranking-desc">월세 기준</span>
                    </div>
                    <div className="price-ranking-item">
                      <span className="price-ranking-rank">2위</span>
                      <span className="price-ranking-type">빌라/오피스텔</span>
                      <span className="price-ranking-desc">매매 기준</span>
                    </div>
                    <div className="price-ranking-item">
                      <span className="price-ranking-rank">3위</span>
                      <span className="price-ranking-type">아파트</span>
                      <span className="price-ranking-desc">장기 투자</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'investment' && (
            <div className="price-content-section">
              <div className="price-investment-grid">
                <div className="price-investment-card">
                  <h3 className="price-investment-title">
                    💡 투자 전략
                  </h3>
                  <div className="price-investment-content">
                    <div className="investment-strategy">
                      <h4 className="investment-strategy-title">🏠 원룸 투자</h4>
                      <p className="investment-strategy-desc">학생들이 선호하는 홍대, 건대 인근 원룸은 안정적인 수익률을 제공합니다. 월세 수익률 5-7% 예상.</p>
                    </div>
                    <div className="investment-strategy">
                      <h4 className="investment-strategy-title">🏢 아파트 투자</h4>
                      <p className="investment-strategy-desc">강남구 역삼동은 IT 업체 밀집으로 장기 투자에 적합합니다. 연간 가격 상승률 3-5% 예상.</p>
                    </div>
                  </div>
                </div>
                
                <div className="price-investment-card">
                  <h3 className="price-investment-title">
                    ⚠️ 투자 주의사항
                  </h3>
                  <div className="price-investment-content">
                    <div className="investment-warning">
                      <h4 className="investment-warning-title">📋 법규 확인</h4>
                      <p className="investment-warning-desc">부동산 거래 시 관련 법규와 세금을 반드시 확인하세요. 전문가 상담을 권장합니다.</p>
                    </div>
                    <div className="investment-warning">
                      <h4 className="investment-warning-title">🔍 상세 조사</h4>
                      <p className="investment-warning-desc">실제 방문과 주변 환경 조사를 통해 투자 결정을 내리세요. 시장 동향을 꼭 파악하세요.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceComparisonModal;
