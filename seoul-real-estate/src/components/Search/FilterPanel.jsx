import React from 'react';
import usePropertyStore from '../../stores/propertyStore';
import { propertyTypes, districts } from '../../data/mockProperties';

const FilterPanel = () => {
  const { filters, setFilters, resetFilters } = usePropertyStore();

  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value });
  };

  const formatPrice = (price) => {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(0)}억`;
    }
    return `${price}만원`;
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
          <span className="text-2xl">🎯</span>
          <span>필터 설정</span>
        </h3>
        <button
          onClick={resetFilters}
          className="text-sm text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200 px-3 py-1 rounded-lg hover:bg-blue-50"
        >
          초기화
        </button>
      </div>

      {/* 부동산 타입 */}
      <div className="mb-6 space-y-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🏠 부동산 타입
        </label>
        <select
          value={filters.propertyType}
          onChange={(e) => handleFilterChange('propertyType', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
        >
          {propertyTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* 지역 */}
      <div className="mb-6 space-y-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📍 지역
        </label>
        <select
          value={filters.district}
          onChange={(e) => handleFilterChange('district', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
        >
          {districts.map((district) => (
            <option key={district.value} value={district.value}>
              {district.label}
            </option>
          ))}
        </select>
      </div>

      {/* 가격 범위 */}
      <div className="mb-6 space-y-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          💰 가격 범위
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="number"
            value={filters.priceRange[0]}
            onChange={(e) => handleFilterChange('priceRange', [parseInt(e.target.value), filters.priceRange[1]])}
            placeholder="최소"
            className="w-1/2 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
          />
          <span className="text-gray-500 font-medium">~</span>
          <input
            type="number"
            value={filters.priceRange[1]}
            onChange={(e) => handleFilterChange('priceRange', [filters.priceRange[0], parseInt(e.target.value)])}
            placeholder="최대"
            className="w-1/2 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
          />
        </div>
        <div className="text-sm text-gray-500 mt-2 text-center bg-blue-50 px-3 py-2 rounded-lg">
          {formatPrice(filters.priceRange[0])} ~ {formatPrice(filters.priceRange[1])}
        </div>
      </div>

      {/* 면적 범위 */}
      <div className="mb-6 space-y-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📐 면적 범위 (㎡)
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="number"
            value={filters.area[0]}
            onChange={(e) => handleFilterChange('area', [parseInt(e.target.value), filters.area[1]])}
            placeholder="최소"
            className="w-1/2 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
          />
          <span className="text-gray-500 font-medium">~</span>
          <input
            type="number"
            value={filters.area[1]}
            onChange={(e) => handleFilterChange('area', [filters.area[0], parseInt(e.target.value)])}
            placeholder="최대"
            className="w-1/2 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
          />
        </div>
        <div className="text-sm text-gray-500 mt-2 text-center bg-green-50 px-3 py-2 rounded-lg">
          {filters.area[0]}㎡ ~ {filters.area[1]}㎡
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
