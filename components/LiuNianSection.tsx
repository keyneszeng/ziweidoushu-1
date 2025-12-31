import React, { useState, useEffect } from 'react';
import { LiuNian, LunarDate, Palace } from '../types';
import { generateSpecificLiuNian } from '../services/geminiService';

interface LiuNianSectionProps {
  initialData: LiuNian;
  userInfo?: LunarDate;
  palaces?: Palace[];
}

export const LiuNianSection: React.FC<LiuNianSectionProps> = ({ initialData, userInfo, palaces }) => {
  const [selectedYear, setSelectedYear] = useState<number>(initialData.year);
  const [dataCache, setDataCache] = useState<Record<number, LiuNian>>({ [initialData.year]: initialData });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with initial data if it changes (e.g. new chart generated)
  useEffect(() => {
    setSelectedYear(initialData.year);
    setDataCache({ [initialData.year]: initialData });
  }, [initialData]);

  // Generate list of next 10 years
  const startYear = new Date().getFullYear(); // Or initialData.year if historical
  const years = Array.from({ length: 10 }, (_, i) => startYear + i);

  const handleYearSelect = async (year: number) => {
    setSelectedYear(year);
    setError(null);

    // If data exists in cache, use it
    if (dataCache[year]) {
      return;
    }

    // Require context to fetch new data
    if (!userInfo || !palaces) {
        setError("无法获取上下文信息，请重新排盘。");
        return;
    }

    setLoading(true);
    try {
        const result = await generateSpecificLiuNian(userInfo, year, palaces);
        setDataCache(prev => ({ ...prev, [year]: result }));
    } catch (err: any) {
        setError(err.message || "获取流年运势失败");
    } finally {
        setLoading(false);
    }
  };

  const displayData = dataCache[selectedYear];

  return (
    <div className="bg-gradient-to-br from-ziwei-dark/80 to-[#2a1b4e]/80 p-6 rounded-xl border border-ziwei-gold/30 backdrop-blur-md shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Decorative background element */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-ziwei-gold/5 rounded-full blur-3xl"></div>
      
      {/* Header & Year Selector */}
      <div className="flex flex-col mb-6 border-b border-white/10 pb-4 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
             <div className="flex items-center gap-3">
                <h3 className="text-2xl font-serif text-ziwei-gold font-bold">流年运势详解</h3>
                {loading && <span className="text-xs text-ziwei-accent animate-pulse">推演天机中...</span>}
             </div>
             
             {/* Score Circle (Only show if data is available) */}
             {displayData && (
                 <div className="flex items-center gap-3 mt-2 md:mt-0">
                    <span className="text-xs text-gray-400">运势评分</span>
                    <div className="relative w-10 h-10 flex items-center justify-center">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#432c7a" strokeWidth="4" />
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={displayData.score >= 80 ? '#34d399' : displayData.score >= 60 ? '#ffd700' : '#f87171'} strokeWidth="4" strokeDasharray={`${displayData.score}, 100`} />
                        </svg>
                        <span className="absolute text-[10px] font-bold text-white">{displayData.score}</span>
                    </div>
                 </div>
             )}
        </div>

        {/* Year Timeline Scroll */}
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
            {years.map(y => {
                const isActive = y === selectedYear;
                const isCached = !!dataCache[y];
                return (
                    <button
                        key={y}
                        onClick={() => handleYearSelect(y)}
                        disabled={loading && !isActive} // Disable other buttons while loading
                        className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm transition-all border ${
                            isActive 
                            ? 'bg-ziwei-gold text-ziwei-dark border-ziwei-gold font-bold shadow-[0_0_10px_rgba(255,215,0,0.3)] transform scale-105' 
                            : 'bg-white/5 text-gray-400 border-white/10 hover:border-ziwei-gold/50 hover:text-white'
                        }`}
                    >
                        {y}年
                        {isCached && !isActive && <span className="ml-1 text-[8px] text-green-400">●</span>}
                    </button>
                );
            })}
        </div>
      </div>

      {/* Content Area */}
      {error ? (
          <div className="py-12 text-center bg-red-900/20 rounded-lg border border-red-500/30">
              <p className="text-red-300 mb-2">{error}</p>
              <button onClick={() => handleYearSelect(selectedYear)} className="text-xs px-3 py-1 bg-red-800 rounded hover:bg-red-700 text-white">重试</button>
          </div>
      ) : loading && !displayData ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-2 border-ziwei-purple border-t-ziwei-gold rounded-full animate-spin"></div>
              <p className="text-gray-400 text-sm">正在推算 {selectedYear} 年流年运程...</p>
          </div>
      ) : displayData ? (
        <div className="animate-fade-in">
             <div className="flex items-center gap-3 mb-4">
                 <span className="text-xl text-white font-bold">{displayData.ganZhi}年</span>
                 <span className="bg-ziwei-purple/40 text-ziwei-light border border-ziwei-purple/50 text-xs px-2 py-0.5 rounded">
                     年度关键词: <span className="text-ziwei-gold">{displayData.theme}</span>
                 </span>
             </div>

            {/* Main Summary Enhanced */}
            <div className="mb-6 relative overflow-hidden rounded-xl border border-ziwei-gold/30 bg-gradient-to-r from-ziwei-purple/20 via-ziwei-dark/40 to-transparent p-6 shadow-lg">
                {/* Decorative Icon Background */}
                <div className="absolute top-0 right-0 -mt-2 -mr-2 text-ziwei-gold/5 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                </div>

                <div className="relative z-10">
                <h4 className="flex items-center gap-2 text-ziwei-gold font-bold mb-4 text-lg border-b border-ziwei-gold/20 pb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    年度总批
                </h4>
                <p className="text-gray-100 leading-8 font-serif text-base md:text-lg text-justify opacity-90">
                    {displayData.summary}
                </p>
                </div>
            </div>

            {/* Aspects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Career */}
                <div className="bg-white/5 p-4 rounded-lg border border-white/5 hover:border-blue-400/30 transition-colors group flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="p-1.5 bg-blue-500/20 text-blue-300 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        </span>
                        <h5 className="font-bold text-blue-200">事业 / 学业</h5>
                    </div>
                    <p className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors mb-3 flex-grow leading-relaxed text-justify">{displayData.aspects.career}</p>
                    {displayData.aspects.careerHighlights && displayData.aspects.careerHighlights.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/10">
                        <span className="text-xs text-blue-300/60 font-bold block mb-1">特别关注事项:</span>
                        <ul className="space-y-1">
                            {displayData.aspects.careerHighlights.map((item, idx) => (
                            <li key={idx} className="text-xs text-blue-100/80 flex items-start gap-1.5">
                                <span className="text-blue-400 mt-0.5">•</span>
                                <span>{item}</span>
                            </li>
                            ))}
                        </ul>
                        </div>
                    )}
                </div>

                {/* Wealth */}
                <div className="bg-white/5 p-4 rounded-lg border border-white/5 hover:border-ziwei-gold/30 transition-colors group">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="p-1.5 bg-yellow-500/20 text-yellow-300 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </span>
                        <h5 className="font-bold text-yellow-200">财运 / 投资</h5>
                    </div>
                    <p className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors leading-relaxed text-justify">{displayData.aspects.wealth}</p>
                </div>

                {/* Love */}
                <div className="bg-white/5 p-4 rounded-lg border border-white/5 hover:border-pink-400/30 transition-colors group flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="p-1.5 bg-pink-500/20 text-pink-300 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        </span>
                        <h5 className="font-bold text-pink-200">感情 / 桃花</h5>
                    </div>
                    <p className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors mb-3 flex-grow leading-relaxed text-justify">{displayData.aspects.love}</p>
                    {displayData.aspects.loveHighlights && displayData.aspects.loveHighlights.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/10">
                        <span className="text-xs text-pink-300/60 font-bold block mb-1">特别关注事项:</span>
                        <ul className="space-y-1">
                            {displayData.aspects.loveHighlights.map((item, idx) => (
                            <li key={idx} className="text-xs text-pink-100/80 flex items-start gap-1.5">
                                <span className="text-pink-400 mt-0.5">•</span>
                                <span>{item}</span>
                            </li>
                            ))}
                        </ul>
                        </div>
                    )}
                </div>

                {/* Health */}
                <div className="bg-white/5 p-4 rounded-lg border border-white/5 hover:border-green-400/30 transition-colors group">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="p-1.5 bg-green-500/20 text-green-300 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </span>
                        <h5 className="font-bold text-green-200">健康 / 疾厄</h5>
                    </div>
                    <p className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors leading-relaxed text-justify">{displayData.aspects.health}</p>
                </div>
            </div>
        </div>
      ) : null}
    </div>
  );
};