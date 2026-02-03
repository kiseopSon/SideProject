import React, { useState, useEffect } from 'react';
import usePropertyStore from '../../stores/propertyStore';
import './StatsModal.css';

const StatsModal = ({ isOpen, onClose }) => {
  const { properties } = usePropertyStore();
  const [activeTab, setActiveTab] = useState('overview');

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

  const getPropertyTypeCount = (type) => {
    return properties.filter(p => p.type === type).length;
  };

  const getAveragePrice = (type) => {
    const typeProperties = properties.filter(p => p.type === type);
    if (typeProperties.length === 0) return 0;
    
    const totalPrice = typeProperties.reduce((sum, p) => {
      if (p.type === '원룸') return sum + (parseInt(p.price.replace('만원', '')) || 0);
      if (p.type === '빌라/오피스텔') return sum + (parseFloat(p.price.replace('억', '')) || 0);
      if (p.type === '아파트') return sum + (parseFloat(p.price.replace('억', '')) || 0);
      return sum;
    }, 0);
    
    return typeProperties.length > 0 ? totalPrice / typeProperties.length : 0;
  };

  const formatPrice = (price, type) => {
    if (type === '원룸') return `${Math.round(price)}만원`;
    return `${price.toFixed(1)}억`;
  };

  return (
    <div className="stats-modal-overlay" onClick={onClose}>
      <div className="stats-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="stats-modal-header">
          <div className="stats-modal-header-content">
            <div className="stats-modal-title-section">
              <div className="stats-modal-icon">📊</div>
              <div>
                <h2 className="stats-modal-title">서울 부동산 통계 대시보드</h2>
                <p className="stats-modal-subtitle">실시간 시장 데이터 및 분석</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="stats-modal-close-button"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="stats-modal-tabs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`stats-tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          >
            📈 전체 개요
          </button>
          <button
            onClick={() => setActiveTab('regional')}
            className={`stats-tab-button ${activeTab === 'regional' ? 'active' : ''}`}
          >
            🗺️ 지역별 분석
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`stats-tab-button ${activeTab === 'trends' ? 'active' : ''}`}
          >
            📊 트렌드 분석
          </button>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="stats-modal-content">
          {activeTab === 'overview' && (
            <div className="stats-content-section">
              <div className="stats-grid">
                {/* 주요 지표 */}
                <div className="stats-main-section">
                  <div className="stats-card">
                    <h3 className="stats-card-title">
                      🎯 주요 시장 지표
                    </h3>
                    <div className="stats-indicators-grid">
                      <div className="stats-indicator">
                        <div className="stats-indicator-value">{properties.length}</div>
                        <div className="stats-indicator-label">전체 매물</div>
                        <div className="stats-indicator-desc">현재 등록된</div>
                      </div>
                      <div className="stats-indicator">
                        <div className="stats-indicator-value">4</div>
                        <div className="stats-indicator-label">지역</div>
                        <div className="stats-indicator-desc">강남, 마포, 종로, 서초</div>
                      </div>
                      <div className="stats-indicator">
                        <div className="stats-indicator-value">3</div>
                        <div className="stats-indicator-label">매물 유형</div>
                        <div className="stats-indicator-desc">원룸, 빌라, 아파트</div>
                      </div>
                      <div className="stats-indicator">
                        <div className="stats-indicator-value">85%</div>
                        <div className="stats-indicator-label">평균 점유율</div>
                        <div className="stats-indicator-desc">현재 시장 상황</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="stats-card">
                    <h3 className="stats-card-title">
                      💰 가격 분포 분석
                    </h3>
                    <div className="stats-price-analysis">
                      <div className="price-bar-item">
                        <div className="price-bar-header">
                          <span className="price-bar-label">원룸</span>
                          <span className="price-bar-count">{getPropertyTypeCount('원룸')}개</span>
                        </div>
                        <div className="price-bar-container">
                          <div 
                            className="price-bar-fill"
                            style={{ width: `${(getPropertyTypeCount('원룸') / properties.length) * 100}%` }}
                          ></div>
                        </div>
                        <div className="price-bar-avg">
                          평균: {formatPrice(getAveragePrice('원룸'), '원룸')}
                        </div>
                      </div>
                      
                      <div className="price-bar-item">
                        <div className="price-bar-header">
                          <span className="price-bar-label">빌라/오피스텔</span>
                          <span className="price-bar-count">{getPropertyTypeCount('빌라/오피스텔')}개</span>
                        </div>
                        <div className="price-bar-container">
                          <div 
                            className="price-bar-fill"
                            style={{ width: `${(getPropertyTypeCount('빌라/오피스텔') / properties.length) * 100}%` }}
                          ></div>
                        </div>
                        <div className="price-bar-avg">
                          평균: {formatPrice(getAveragePrice('빌라/오피스텔'), '빌라/오피스텔')}
                        </div>
                      </div>
                      
                      <div className="price-bar-item">
                        <div className="price-bar-header">
                          <span className="price-bar-label">아파트</span>
                          <span className="price-bar-count">{getPropertyTypeCount('아파트')}개</span>
                        </div>
                        <div className="price-bar-container">
                          <div 
                            className="price-bar-fill"
                            style={{ width: `${(getPropertyTypeCount('아파트') / properties.length) * 100}%` }}
                          ></div>
                        </div>
                        <div className="price-bar-avg">
                          평균: {formatPrice(getAveragePrice('아파트'), '아파트')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 요약 통계 */}
                <div className="stats-sidebar">
                  <div className="stats-sidebar-card">
                    <h3 className="stats-sidebar-title">
                      📈 시장 동향
                    </h3>
                    <div className="stats-sidebar-items">
                      <div className="stats-sidebar-item">
                        <div className="stats-sidebar-label">전월 대비</div>
                        <div className="stats-sidebar-value positive">+2.3%</div>
                        <div className="stats-sidebar-desc">가격 상승률</div>
                      </div>
                      <div className="stats-sidebar-item">
                        <div className="stats-sidebar-label">거래량</div>
                        <div className="stats-sidebar-value positive">+15%</div>
                        <div className="stats-sidebar-desc">전월 대비 증가</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="stats-sidebar-card">
                    <h3 className="stats-sidebar-title">
                      🏆 인기 지역
                    </h3>
                    <div className="stats-sidebar-items">
                      <div className="stats-sidebar-item">
                        <span className="stats-sidebar-rank">1위</span>
                        <span className="stats-sidebar-location">강남구</span>
                      </div>
                      <div className="stats-sidebar-item">
                        <span className="stats-sidebar-rank">2위</span>
                        <span className="stats-sidebar-location">마포구</span>
                      </div>
                      <div className="stats-sidebar-item">
                        <span className="stats-sidebar-rank">3위</span>
                        <span className="stats-sidebar-location">종로구</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'regional' && (
            <div className="stats-content-section">
              <div className="stats-regional-grid">
                <div className="stats-regional-card">
                  <h3 className="stats-regional-title">
                    🏢 강남구 분석
                  </h3>
                  <div className="stats-regional-content">
                    <div className="stats-regional-main">
                      <div className="stats-regional-main-label">평균 가격</div>
                      <div className="stats-regional-main-value">8.5억</div>
                      <div className="stats-regional-main-change">📈 +2.3% vs 전월</div>
                    </div>
                    <div className="stats-regional-details">
                      <div className="stats-regional-detail">
                        <div className="stats-regional-detail-value">3</div>
                        <div className="stats-regional-detail-label">등록 매물</div>
                      </div>
                      <div className="stats-regional-detail">
                        <div className="stats-regional-detail-value">85%</div>
                        <div className="stats-regional-detail-label">점유율</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="stats-regional-card">
                  <h3 className="stats-regional-title">
                    🏠 마포구 분석
                  </h3>
                  <div className="stats-regional-content">
                    <div className="stats-regional-main">
                      <div className="stats-regional-main-label">평균 가격</div>
                      <div className="stats-regional-main-value">45만원</div>
                      <div className="stats-regional-main-change">📈 +1.8% vs 전월</div>
                    </div>
                    <div className="stats-regional-details">
                      <div className="stats-regional-detail">
                        <div className="stats-regional-detail-value">3</div>
                        <div className="stats-regional-detail-label">등록 매물</div>
                      </div>
                      <div className="stats-regional-detail">
                        <div className="stats-regional-detail-value">78%</div>
                        <div className="stats-regional-detail-label">점유율</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trends' && (
            <div className="stats-content-section">
              <div className="stats-trends-grid">
                <div className="stats-trends-card">
                  <h3 className="stats-trends-title">
                    📈 월별 가격 트렌드
                  </h3>
                  <div className="stats-trends-content">
                    <div className="trend-item">
                      <div className="trend-header">
                        <span className="trend-month">1월</span>
                        <span className="trend-change positive">+1.2%</span>
                      </div>
                      <div className="trend-bar-container">
                        <div className="trend-bar-fill" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                    <div className="trend-item">
                      <div className="trend-header">
                        <span className="trend-month">2월</span>
                        <span className="trend-change positive">+2.1%</span>
                      </div>
                      <div className="trend-bar-container">
                        <div className="trend-bar-fill" style={{ width: '80%' }}></div>
                      </div>
                    </div>
                    <div className="trend-item">
                      <div className="trend-header">
                        <span className="trend-month">3월</span>
                        <span className="trend-change positive">+2.3%</span>
                      </div>
                      <div className="trend-bar-container">
                        <div className="trend-bar-fill" style={{ width: '90%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="stats-trends-card">
                  <h3 className="stats-trends-title">
                    🎯 투자 전망
                  </h3>
                  <div className="stats-trends-content">
                    <div className="investment-outlook">
                      <h4 className="investment-title">🏠 원룸 시장</h4>
                      <p className="investment-desc">학생들이 선호하는 지역은 안정적인 수익률을 제공할 것으로 예상됩니다.</p>
                    </div>
                    <div className="investment-outlook">
                      <h4 className="investment-title">🏢 아파트 시장</h4>
                      <p className="investment-desc">IT 업체 밀집 지역은 장기 투자에 적합하며, 지속적인 가격 상승이 예상됩니다.</p>
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

export default StatsModal;
