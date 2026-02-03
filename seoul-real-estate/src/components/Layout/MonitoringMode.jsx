import React, { useState } from 'react';
import usePropertyStore from '../../stores/propertyStore';
import SearchBar from '../Search/SearchBar';
import FilterPanel from '../Search/FilterPanel';

const MonitoringMode = ({ isActive, onClose, clickedLocation }) => {
  const { filteredProperties } = usePropertyStore();
  const [activeTab, setActiveTab] = useState('search');

  const handleClose = () => {
    onClose();
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-900/90 to-purple-900/90 backdrop-blur-md">
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl w-full max-w-7xl h-[95vh] overflow-hidden border border-white/20">
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-8 rounded-t-3xl relative overflow-hidden">
            {/* 배경 패턴 */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 -translate-y-12"></div>
              <div className="absolute bottom-0 left-1/4 w-20 h-20 bg-white rounded-full -translate-x-10 translate-y-10"></div>
            </div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="text-4xl">🏠</div>
                <div>
                  <h2 className="text-3xl font-bold mb-2">서울 부동산 모니터링 센터</h2>
                  <p className="text-blue-100 text-lg">실시간 시장 분석 및 부동산 검색</p>
                </div>
              </div>
              
              {clickedLocation && (
                <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/30">
                  <div className="text-center">
                    <div className="text-sm text-blue-100 mb-1">선택된 위치</div>
                    <div className="text-lg font-mono">
                      {clickedLocation.lat.toFixed(4)}, {clickedLocation.lng.toFixed(4)}
                    </div>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-200 transition-all duration-300 p-3 hover:bg-white/20 rounded-2xl hover:scale-110"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-8 py-6 border-b border-gray-200">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('search')}
                className={`px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'search'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl scale-105'
                    : 'text-gray-700 hover:bg-white hover:shadow-lg'
                }`}
              >
                🔍 검색 & 필터
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'analytics'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl scale-105'
                    : 'text-gray-700 hover:bg-white hover:shadow-lg'
                }`}
              >
                📊 시장 분석
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                className={`px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'insights'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl scale-105'
                    : 'text-gray-700 hover:bg-white hover:shadow-lg'
                }`}
              >
                💡 투자 인사이트
              </button>
            </div>
          </div>

          {/* 컨텐츠 영역 */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'search' && (
              <div className="p-8 h-full overflow-y-auto">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* 검색 영역 */}
                  <div className="xl:col-span-2 space-y-8">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-3xl shadow-xl border border-blue-100">
                      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-3">
                        <span className="text-3xl">🔍</span>
                        <span>부동산 검색</span>
                      </h3>
                      <SearchBar />
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-3xl shadow-xl border border-purple-100">
                      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-3">
                        <span className="text-3xl">🎯</span>
                        <span>필터 설정</span>
                      </h3>
                      <FilterPanel />
                    </div>
                  </div>
                  
                  {/* 통계 영역 */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-3xl shadow-xl border border-green-100">
                      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                        <span className="text-2xl">📊</span>
                        <span>검색 통계</span>
                      </h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/80 p-4 rounded-2xl text-center shadow-lg">
                            <div className="text-3xl font-bold text-blue-600">{filteredProperties.length}</div>
                            <div className="text-sm text-blue-600 font-medium">검색 결과</div>
                          </div>
                          <div className="bg-white/80 p-4 rounded-2xl text-center shadow-lg">
                            <div className="text-3xl font-bold text-green-600">8</div>
                            <div className="text-sm text-green-600 font-medium">전체 매물</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-3xl shadow-xl border border-orange-100">
                      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                        <span className="text-2xl">💰</span>
                        <span>가격 분포</span>
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-white/80 rounded-xl">
                          <span className="font-medium">원룸</span>
                          <span className="text-blue-600 font-bold">42-55만원</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/80 rounded-xl">
                          <span className="font-medium">빌라/오피스텔</span>
                          <span className="text-green-600 font-bold">6.5-7.5억</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/80 rounded-xl">
                          <span className="font-medium">아파트</span>
                          <span className="text-purple-600 font-bold">8.5억</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="p-8 h-full overflow-y-auto">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-3xl shadow-xl border border-blue-100">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-3">
                      <span className="text-3xl">📈</span>
                      <span>지역별 가격 트렌드</span>
                    </h3>
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 rounded-2xl text-white shadow-lg">
                        <div className="text-sm opacity-90 mb-2">강남구</div>
                        <div className="text-3xl font-bold mb-2">8.5억</div>
                        <div className="text-sm opacity-90">📈 +2.3% vs 전월</div>
                      </div>
                      <div className="bg-gradient-to-r from-green-500 to-blue-500 p-6 rounded-2xl text-white shadow-lg">
                        <div className="text-sm opacity-90 mb-2">마포구</div>
                        <div className="text-3xl font-bold mb-2">45만원</div>
                        <div className="text-sm opacity-90">📈 +1.8% vs 전월</div>
                      </div>
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-2xl text-white shadow-lg">
                        <div className="text-sm opacity-90 mb-2">종로구</div>
                        <div className="text-3xl font-bold mb-2">12억</div>
                        <div className="text-sm opacity-90">📈 +3.1% vs 전월</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-3xl shadow-xl border border-purple-100">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-3">
                      <span className="text-3xl">🏘️</span>
                      <span>부동산 타입별 분포</span>
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white/80 rounded-2xl shadow-lg">
                        <span className="flex items-center text-lg font-medium">
                          <span className="text-2xl mr-3">🏢</span>
                          <span>아파트</span>
                        </span>
                        <span className="text-blue-600 font-bold text-xl">12.5%</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white/80 rounded-2xl shadow-lg">
                        <span className="flex items-center text-lg font-medium">
                          <span className="text-2xl mr-3">🏠</span>
                          <span>원룸</span>
                        </span>
                        <span className="text-green-600 font-bold text-xl">37.5%</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white/80 rounded-2xl shadow-lg">
                        <span className="flex items-center text-lg font-medium">
                          <span className="text-2xl mr-3">🏬</span>
                          <span>오피스텔</span>
                        </span>
                        <span className="text-purple-600 font-bold text-xl">12.5%</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white/80 rounded-2xl shadow-lg">
                        <span className="flex items-center text-lg font-medium">
                          <span className="text-2xl mr-3">🏪</span>
                          <span>상가</span>
                        </span>
                        <span className="text-orange-600 font-bold text-xl">25%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="p-8 h-full overflow-y-auto">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-3xl shadow-xl border border-emerald-100">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-3">
                      <span className="text-3xl">💡</span>
                      <span>투자 전략</span>
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-white/80 p-6 rounded-2xl shadow-lg">
                        <h4 className="font-bold text-lg text-emerald-800 mb-3">🏠 원룸 투자</h4>
                        <p className="text-gray-700">학생들이 선호하는 홍대, 건대 인근 원룸은 안정적인 수익률을 제공합니다.</p>
                      </div>
                      <div className="bg-white/80 p-6 rounded-2xl shadow-lg">
                        <h4 className="font-bold text-lg text-emerald-800 mb-3">🏢 아파트 투자</h4>
                        <p className="text-gray-700">강남구 역삼동은 IT 업체 밀집으로 장기 투자에 적합합니다.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-3xl shadow-xl border border-amber-100">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-3">
                      <span className="text-3xl">⚠️</span>
                      <span>투자 주의사항</span>
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-white/80 p-6 rounded-2xl shadow-lg">
                        <h4 className="font-bold text-lg text-orange-800 mb-3">📋 법규 확인</h4>
                        <p className="text-gray-700">부동산 거래 시 관련 법규와 세금을 반드시 확인하세요.</p>
                      </div>
                      <div className="bg-white/80 p-6 rounded-2xl shadow-lg">
                        <h4 className="font-bold text-lg text-orange-800 mb-3">🔍 상세 조사</h4>
                        <p className="text-gray-700">실제 방문과 주변 환경 조사를 통해 투자 결정을 내리세요.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringMode;
