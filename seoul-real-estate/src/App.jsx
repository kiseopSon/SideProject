import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useSearchParams } from 'react-router-dom';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import KakaoMap from './components/Map/KakaoMap';
import SeoulOverviewMap from './components/Map/SeoulOverviewMap';
import PropertyList from './components/Property/PropertyList';
import MonitoringMode from './components/Layout/MonitoringMode';
import StatsModal from './components/Layout/StatsModal';
import PriceComparisonModal from './components/Layout/PriceComparisonModal';
import DatabaseStats from './components/DatabaseStats';
import usePropertyStore from './stores/propertyStore';
import { mockProperties } from './data/mockProperties';
import './App.css';

// 서울시 개요 페이지 컴포넌트
function OverviewPage() {
  const { setSelectedDistrict, setSelectedProperty } = usePropertyStore();
  
  const handleDistrictClick = (district) => {
    setSelectedDistrict(district);
    // URL로 이동
    window.location.href = `/district/${district.id}`;
  };

  const handleOpenPriceComparison = () => {
    // URL로 이동
    window.location.href = '/price-comparison';
  };

  return (
    <div className="app-overview-container">
      <SeoulOverviewMap 
        onDistrictClick={handleDistrictClick}
        onOpenPriceComparison={handleOpenPriceComparison}
      />
    </div>
  );
}

// 지역별 상세 지도 페이지 컴포넌트
function DistrictDetailPageWrapper() {
  const { districtId } = useParams();
  return <DistrictDetailPage districtId={districtId} />;
}

function DistrictDetailPage({ districtId }) {
  const { selectedDistrict, setSelectedDistrict, setSelectedProperty } = usePropertyStore();
  
  const handleMarkerClick = (property) => {
    setSelectedProperty(property);
  };

  const handleMapClick = (location) => {
    // URL로 이동
    window.location.href = `/properties?lat=${location.lat}&lng=${location.lng}`;
  };

  const handleBackToOverview = () => {
    window.location.href = '/';
  };

  // districtId로 지역 정보 가져오기 (실제로는 API 호출)
  useEffect(() => {
    // 여기서 districtId를 사용하여 API 호출
    // 예: fetchDistrictData(districtId)
    console.log('Loading district data for:', districtId);
  }, [districtId]);

  return (
    <div className="app-map-container">
      <div className="map-header">
        <button 
          onClick={handleBackToOverview}
          className="back-to-overview-btn"
        >
          ← 서울시 전체로 돌아가기
        </button>
        <h2 className="selected-district-title">
          {selectedDistrict?.name || `지역 ${districtId}`} 상세 지도
        </h2>
      </div>
      <KakaoMap
        properties={mockProperties}
        onMarkerClick={handleMarkerClick}
        selectedProperty={null}
        onMapClick={handleMapClick}
        center={selectedDistrict?.center}
      />
    </div>
  );
}

// 매물 리스트 페이지 컴포넌트
function PropertyListPageWrapper() {
  const [searchParams] = useSearchParams();
  return <PropertyListPage searchParams={searchParams} />;
}

function PropertyListPage({ searchParams }) {
  const { setClickedLocation } = usePropertyStore();
  
  useEffect(() => {
    // URL 파라미터에서 위치 정보 추출
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const district = searchParams.get('district');
    
    if (lat && lng) {
      setClickedLocation({ lat: parseFloat(lat), lng: parseFloat(lng) });
    }
    
    // 여기서 API 호출하여 해당 지역의 매물 데이터 가져오기
    console.log('Loading properties for:', { lat, lng, district });
  }, [searchParams, setClickedLocation]);

  const handleBackToDistrict = () => {
    // 이전 페이지로 돌아가기
    window.history.back();
  };

  return (
    <div className="app-list-layout">
      <div className="app-sidebar-container">
        <Sidebar />
      </div>
      
      <div className="app-content-area">
        <div className="app-property-list-container">
          <div className="app-property-list-content">
            <PropertyList />
          </div>
        </div>
      </div>
      
      <MonitoringMode
        isActive={true}
        onClose={handleBackToDistrict}
        clickedLocation={null}
      />
    </div>
  );
}

// 데이터베이스 통계 페이지 컴포넌트
function DatabaseStatsPage() {
  return (
    <div className="database-stats-page-container">
      <DatabaseStats />
    </div>
  );
}

// 통계 페이지 컴포넌트
function StatsPage() {
  return (
    <div className="stats-page-container">
      <StatsModal
        isOpen={true}
        onClose={() => window.location.href = '/'}
      />
    </div>
  );
}

// 가격 비교 페이지 컴포넌트
function PriceComparisonPage() {
  return (
    <div className="price-comparison-page-container">
      <PriceComparisonModal
        isOpen={true}
        onClose={() => window.location.href = '/'}
      />
    </div>
  );
}

function App() {
  const { setProperties } = usePropertyStore();

  useEffect(() => {
    // 앱 시작 시 샘플 데이터 로드
    setProperties(mockProperties);
  }, [setProperties]);

  return (
    <Router>
      <div className="app-container">
        <Header 
          onOpenStats={() => window.location.href = '/stats'}
          onOpenPriceComparison={() => window.location.href = '/price-comparison'}
          onOpenDatabaseStats={() => window.location.href = '/database-stats'}
        />
        
        <div className="app-main-content">
          <Routes>
            {/* 메인 페이지 - 서울시 개요 */}
            <Route path="/" element={<OverviewPage />} />
            
            {/* 지역별 상세 지도 */}
            <Route path="/district/:districtId" element={<DistrictDetailPageWrapper />} />
            
            {/* 매물 리스트 */}
            <Route path="/properties" element={<PropertyListPageWrapper />} />
            
            {/* 데이터베이스 통계 페이지 */}
            <Route path="/database-stats" element={<DatabaseStatsPage />} />
            
            {/* 통계 페이지 */}
            <Route path="/stats" element={<StatsPage />} />
            
            {/* 가격 비교 페이지 */}
            <Route path="/price-comparison" element={<PriceComparisonPage />} />
            
            {/* 404 페이지 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
