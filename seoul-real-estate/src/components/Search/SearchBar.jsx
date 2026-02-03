import React, { useState } from 'react';
import usePropertyStore from '../../stores/propertyStore';

const SearchBar = () => {
  const { searchQuery, setSearchQuery } = usePropertyStore();
  const [inputValue, setInputValue] = useState(searchQuery);
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(inputValue);
  };

  const handleClear = () => {
    setInputValue('');
    setSearchQuery('');
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="relative">
        <div className={`relative transition-all duration-300 ${
          isFocused ? 'scale-105' : 'scale-100'
        }`}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="지역명, 역명, 부동산명으로 검색하세요..."
            className="w-full px-5 py-4 pl-14 pr-24 text-gray-900 bg-white/90 backdrop-blur-sm border-2 border-white/50 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-lg hover:shadow-xl"
          />
          
          {/* 검색 아이콘 */}
          <div className="absolute inset-y-0 left-0 flex items-center pl-5">
            <div className="text-blue-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {/* 우측 버튼들 */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {inputValue && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 mr-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            
            <button
              type="submit"
              className="btn-primary px-6 py-2 text-sm font-medium rounded-xl hover:scale-105 transition-all duration-200"
            >
              검색
            </button>
          </div>
        </div>
      </form>
      
      {/* 검색 팁 */}
      <div className="mt-3 text-xs text-gray-500 text-center">
        💡 예시: "강남역", "홍대", "역삼동 아파트"
      </div>
    </div>
  );
};

export default SearchBar;
