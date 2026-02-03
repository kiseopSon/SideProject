import React from 'react';
import usePropertyStore from '../../stores/propertyStore';
import PropertyCard from './PropertyCard';

const PropertyList = () => {
  const { filteredProperties } = usePropertyStore();

  if (filteredProperties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-6xl mb-4 animate-bounce">🏠</div>
        <h3 className="text-2xl font-bold text-gray-700 mb-2">검색 결과가 없습니다</h3>
        <p className="text-gray-500 mb-6">다른 검색 조건을 시도해보세요</p>
        <div className="flex space-x-4 text-4xl animate-pulse">
          <span>🔍</span>
          <span>🎯</span>
          <span>✨</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* 섹션 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center space-x-3">
            <span className="text-3xl">🏠</span>
            <span>부동산 목록</span>
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {filteredProperties.length}개
            </span>
          </h2>
          <div className="flex items-center space-x-2 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">실시간 업데이트</span>
          </div>
        </div>
        <p className="text-gray-600">현재 등록된 매물을 확인하고 상세 정보를 살펴보세요</p>
      </div>

      {/* 부동산 카드 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 h-full overflow-y-auto pb-6">
        {filteredProperties.map((property, index) => (
          <div
            key={property.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <PropertyCard property={property} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyList;
