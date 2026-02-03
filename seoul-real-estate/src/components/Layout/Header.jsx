import React from 'react';
import './Header.css';

const Header = ({ onOpenStats, onOpenPriceComparison, onOpenDatabaseStats }) => {
  const handleTitleClick = () => {
    window.location.href = '/';
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="header-title" onClick={handleTitleClick}>
            🏠 서울 부동산 지도
          </h1>
          <div className="header-badge">
            실시간 부동산 정보
          </div>
        </div>
        
        <div className="header-center">
          <div className="header-status">
            <span className="status-item">
              <span className="status-icon">🔄</span>
              실시간 업데이트
            </span>
            <span className="status-item">
              <span className="status-icon">✅</span>
              정확한 정보
            </span>
          </div>
        </div>
        
        <div className="header-right">
          <button 
            onClick={onOpenDatabaseStats}
            className="header-button database-button"
          >
            🗄️ DB 통계
          </button>
          <button 
            onClick={onOpenStats}
            className="header-button stats-button"
          >
            📊 통계
          </button>
          <button 
            onClick={onOpenPriceComparison}
            className="header-button price-button"
          >
            💰 가격 비교
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
