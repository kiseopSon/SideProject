import React, { useState } from 'react';
import SearchBar from '../Search/SearchBar';
import FilterPanel from '../Search/FilterPanel';
import './Sidebar.css';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (isCollapsed) {
    return (
      <div className="sidebar-collapsed">
        <button 
          onClick={toggleCollapse}
          className="sidebar-toggle-button"
          title="사이드바 펼치기"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="sidebar-container">
      <div className="sidebar-header">
        <button 
          onClick={toggleCollapse}
          className="sidebar-toggle-button"
          title="사이드바 접기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>
      
      <div className="sidebar-content">
        <div className="sidebar-section">
          <h3 className="sidebar-section-title">
            🔍 검색
          </h3>
          <SearchBar />
        </div>
        
        <div className="sidebar-section">
          <h3 className="sidebar-section-title">
            🎛️ 필터
          </h3>
          <FilterPanel />
        </div>
        
        <div className="sidebar-tips">
          <h3 className="sidebar-tips-title">
            💡 검색 팁
          </h3>
          <ul className="sidebar-tips-list">
            <li>지역명으로 검색하면 더 정확한 결과를 얻을 수 있어요</li>
            <li>가격 범위를 설정하면 예산에 맞는 매물을 찾을 수 있어요</li>
            <li>매물 유형을 선택하면 원하는 스타일의 집을 찾을 수 있어요</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
