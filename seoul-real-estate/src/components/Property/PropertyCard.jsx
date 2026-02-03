import React from 'react';
import usePropertyStore from '../../stores/propertyStore';

const PropertyCard = ({ property, isSelected = false }) => {
  const { setSelectedProperty } = usePropertyStore();

  const formatPrice = (price) => {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(0)}억`;
    }
    return `${price}만원`;
  };

  const getPropertyTypeLabel = (type) => {
    const typeMap = {
      apartment: '아파트',
      villa: '빌라',
      officetel: '오피스텔',
      studio: '원룸',
      commercial: '상가'
    };
    return typeMap[type] || type;
  };

  const getPropertyTypeIcon = (type) => {
    const iconMap = {
      apartment: '🏢',
      villa: '🏡',
      officetel: '🏬',
      studio: '🏠',
      commercial: '🏪'
    };
    return iconMap[type] || '🏠';
  };

  const handleClick = () => {
    setSelectedProperty(property);
  };

  return (
    <div
      className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
        isSelected ? 'ring-4 ring-blue-500 ring-opacity-50 scale-105' : ''
      } animate-fade-in-up`}
      onClick={handleClick}
    >
      <div className="relative">
        <img
          src={property.image}
          alt={property.name}
          className="w-full h-48 object-cover transition-transform duration-500 hover:scale-110"
        />
        
        {/* 오버레이 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        
        {/* 상단 태그들 */}
        <div className="absolute top-3 left-3 flex space-x-2">
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-blue-600/90 backdrop-blur-sm rounded-full">
            {getPropertyTypeIcon(property.type)} {getPropertyTypeLabel(property.type)}
          </span>
        </div>
        
        {/* 가격 태그 */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center px-3 py-1 text-sm font-bold text-white bg-red-500/90 backdrop-blur-sm rounded-full">
            {formatPrice(property.price)}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-blue-600 transition-colors duration-200">
          {property.name}
        </h3>
        
        <p className="text-sm text-gray-600 mb-4 flex items-center">
          <span className="text-lg mr-2">📍</span>
          {property.address}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4 bg-gray-50 px-4 py-3 rounded-xl">
          <span className="flex items-center">
            <span className="mr-1">📐</span>
            {property.area}㎡
          </span>
          <span className="flex items-center">
            <span className="mr-1">🛏️</span>
            {property.rooms}룸 {property.bathrooms}욕실
          </span>
          <span className="flex items-center">
            <span className="mr-1">📅</span>
            {property.yearBuilt}년
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {property.parking && (
            <span className="inline-flex items-center px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">
              🚗 주차가능
            </span>
          )}
          {property.elevator && (
            <span className="inline-flex items-center px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
              🛗 엘리베이터
            </span>
          )}
        </div>
        
        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
          {property.description}
        </p>
      </div>
    </div>
  );
};

export default PropertyCard;
