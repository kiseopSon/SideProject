import React, { useState, useEffect } from 'react';
import { Map, MapMarker } from 'react-kakao-maps-sdk';

const KakaoMap = ({ properties = [], onMarkerClick, selectedProperty, onMapClick }) => {
  const [map, setMap] = useState(null);

  const center = {
    lat: 37.5665, // 서울시청 좌표
    lng: 126.9780
  };

  const handleMarkerClick = (property) => {
    onMarkerClick(property);
  };

  const handleMapClick = (mouseEvent) => {
    if (onMapClick) {
      const lat = mouseEvent.latLng.getLat();
      const lng = mouseEvent.latLng.getLng();
      onMapClick({ lat, lng });
    }
  };

  return (
    <div className="w-full h-full relative">
      <Map
        center={center}
        style={{ width: "100%", height: "100%" }}
        level={12}
        onLoad={(map) => setMap(map)}
        onClick={handleMapClick}
      >
        {properties.map((property) => (
          <MapMarker
            key={property.id}
            position={{ lat: property.lat, lng: property.lng }}
            onClick={() => handleMarkerClick(property)}
            image={{
              src: selectedProperty?.id === property.id 
                ? "data:image/svg+xml;base64," + btoa(`
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="16" fill="#EF4444"/>
                    <circle cx="16" cy="16" r="8" fill="white"/>
                  </svg>
                `)
                : "data:image/svg+xml;base64," + btoa(`
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#3B82F6"/>
                    <circle cx="12" cy="9" r="2.5" fill="white"/>
                  </svg>
                `),
              size: { width: selectedProperty?.id === property.id ? 32 : 24, height: selectedProperty?.id === property.id ? 32 : 24 }
            }}
          />
        ))}
      </Map>
      
      {/* 지도 클릭 안내 */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border border-white/50">
        <div className="flex items-center space-x-2 text-sm text-gray-700">
          <span className="text-lg">💡</span>
          <span>지도를 클릭하면 모니터링 모드가 열립니다</span>
        </div>
      </div>
    </div>
  );
};

export default KakaoMap;
