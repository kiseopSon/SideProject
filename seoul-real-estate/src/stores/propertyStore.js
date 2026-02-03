import { create } from 'zustand';

const usePropertyStore = create((set, get) => ({
  properties: [],
  selectedProperty: null,
  filteredProperties: [],
  searchQuery: '',
  filters: {
    priceRange: [0, 100000],
    area: [0, 200],
    propertyType: 'all',
    district: 'all'
  },
  
  // 부동산 목록 설정
  setProperties: (properties) => set({ properties, filteredProperties: properties }),
  
  // 선택된 부동산 설정
  setSelectedProperty: (property) => set({ selectedProperty: property }),
  
  // 검색 쿼리 설정
  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().applyFilters();
  },
  
  // 필터 설정
  setFilters: (newFilters) => {
    set({ filters: { ...get().filters, ...newFilters } });
    get().applyFilters();
  },
  
  // 필터 적용
  applyFilters: () => {
    const { properties, searchQuery, filters } = get();
    
    let filtered = properties.filter(property => {
      // 검색 쿼리 필터
      if (searchQuery && !property.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !property.address.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // 가격 범위 필터
      if (property.price < filters.priceRange[0] || property.price > filters.priceRange[1]) {
        return false;
      }
      
      // 면적 필터
      if (property.area < filters.area[0] || property.area > filters.area[1]) {
        return false;
      }
      
      // 부동산 타입 필터
      if (filters.propertyType !== 'all' && property.type !== filters.propertyType) {
        return false;
      }
      
      // 지역 필터
      if (filters.district !== 'all' && property.district !== filters.district) {
        return false;
      }
      
      return true;
    });
    
    set({ filteredProperties: filtered });
  },
  
  // 필터 초기화
  resetFilters: () => {
    set({
      searchQuery: '',
      filters: {
        priceRange: [0, 100000],
        area: [0, 200],
        propertyType: 'all',
        district: 'all'
      }
    });
    get().applyFilters();
  }
}));

export default usePropertyStore;
