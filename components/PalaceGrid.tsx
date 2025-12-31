import React, { useState } from 'react';
import { Palace } from '../types';
import { PALACE_DEFINITIONS, STAR_DEFINITIONS } from '../constants';

interface PalaceGridProps {
  palaces: Palace[];
  userInfo: { type: string; summary: string };
}

// Fixed positions for Earthly Branches on the 4x4 grid (Si at Top-Left)
const BRANCH_TO_GRID: Record<string, { row: number; col: number }> = {
  '子': { row: 3, col: 2 }, // Zi (Bottom)
  '丑': { row: 3, col: 1 }, // Chou (Bottom)
  '寅': { row: 3, col: 0 }, // Yin (Bottom-Left)
  '卯': { row: 2, col: 0 }, // Mao (Left)
  '辰': { row: 1, col: 0 }, // Chen (Left)
  '巳': { row: 0, col: 0 }, // Si (Top-Left)
  '午': { row: 0, col: 1 }, // Wu (Top)
  '未': { row: 0, col: 2 }, // Wei (Top)
  '申': { row: 0, col: 3 }, // Shen (Top-Right)
  '酉': { row: 1, col: 3 }, // You (Right)
  '戌': { row: 2, col: 3 }, // Xu (Right)
  '亥': { row: 3, col: 3 }, // Hai (Bottom-Right)
};

// Fallback index-based positions if branch mapping fails (same order: Zi -> Hai)
const FALLBACK_POSITIONS = [
  { row: 3, col: 2 }, // 0: Zi
  { row: 3, col: 1 }, // 1: Chou
  { row: 3, col: 0 }, // 2: Yin
  { row: 2, col: 0 }, // 3: Mao
  { row: 1, col: 0 }, // 4: Chen
  { row: 0, col: 0 }, // 5: Si
  { row: 0, col: 1 }, // 6: Wu
  { row: 0, col: 2 }, // 7: Wei
  { row: 0, col: 3 }, // 8: Shen
  { row: 1, col: 3 }, // 9: You
  { row: 2, col: 3 }, // 10: Xu
  { row: 3, col: 3 }, // 11: Hai
];

const getStarConfig = (type: string) => {
  switch (type) {
    case 'major': return { 
        className: 'text-red-400 font-bold shadow-red-500/20 drop-shadow-sm', 
        icon: '★', 
        label: '主星', 
        border: 'border-red-500/30 bg-red-500/10',
        badge: 'bg-red-900/60 border-red-500/50 text-red-100'
    };
    case 'good': return { 
        className: 'text-emerald-400 font-medium', 
        icon: '✧', 
        label: '吉星', 
        border: 'border-emerald-500/30 bg-emerald-500/10',
        badge: 'bg-emerald-900/60 border-emerald-500/50 text-emerald-100'
    };
    case 'bad': return { 
        className: 'text-slate-400 font-medium', 
        icon: '▲', 
        label: '煞星', 
        border: 'border-slate-500/30 bg-slate-500/10',
        badge: 'bg-slate-700/60 border-slate-500/50 text-slate-200'
    }; 
    default: return { 
        className: 'text-ziwei-light/70', 
        icon: '•', 
        label: '辅星', 
        border: 'border-ziwei-light/10 bg-white/5',
        badge: 'bg-ziwei-purple/40 border-ziwei-light/20 text-ziwei-light/80'
    };
  }
};

const getBrightnessStyles = (brightness?: string) => {
    if (!brightness) return '';
    if (['庙', '旺'].includes(brightness)) {
        return 'text-ziwei-gold border-ziwei-gold/50 bg-ziwei-gold/10 shadow-[0_0_6px_rgba(255,215,0,0.2)] font-bold';
    }
    if (['平', '得', '利'].includes(brightness)) {
        return 'text-blue-200 border-blue-400/30 bg-blue-500/10';
    }
    if (['陷', '不'].includes(brightness)) {
        return 'text-gray-500 border-gray-700 bg-black/40 opacity-80';
    }
    return 'text-gray-400 border-gray-600 bg-gray-800';
};

export const PalaceGrid: React.FC<PalaceGridProps> = ({ palaces, userInfo }) => {
  const [selectedPalace, setSelectedPalace] = useState<Palace | null>(null);

  if (!palaces || palaces.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto my-8 p-12 border-2 border-dashed border-ziwei-purple/50 rounded-lg text-center bg-ziwei-dark/30">
        <p className="text-gray-400 font-serif">暂无宫位数据，请重新生成。</p>
      </div>
    );
  }

  // Create a 4x4 grid map
  const grid = Array(4).fill(null).map(() => Array(4).fill(null));
  
  palaces.forEach((palace, index) => {
    // Try to map by Earthly Branch character
    let pos = null;
    const branchKey = Object.keys(BRANCH_TO_GRID).find(key => palace.earthlyBranch.includes(key));
    
    if (branchKey) {
      pos = BRANCH_TO_GRID[branchKey];
    } else {
      // Fallback: Use index based mapping assuming standard sequence starts at Zi
      pos = FALLBACK_POSITIONS[index % 12];
    }

    if (pos) {
       // @ts-ignore
       grid[pos.row][pos.col] = palace;
    }
  });

  return (
    <>
      <div className="w-full max-w-4xl mx-auto my-8 relative">
        <div className="grid grid-cols-4 gap-1 sm:gap-2 aspect-square bg-ziwei-dark border-4 border-ziwei-purple rounded-lg p-1 shadow-2xl">
          {grid.map((row, rIndex) => (
            row.map((cell: Palace | null, cIndex) => {
              // Center area (User Info)
              const isCenter = (rIndex === 1 || rIndex === 2) && (cIndex === 1 || cIndex === 2);
              
              if (isCenter) {
                // Only render the center content once
                if (rIndex === 1 && cIndex === 1) {
                  return (
                    <div key={`center`} className="col-span-2 row-span-2 bg-ziwei-dark/50 flex flex-col items-center justify-center p-4 border border-ziwei-purple/30 m-1 rounded relative overflow-hidden pointer-events-none">
                      <div className="absolute inset-0 bg-[url('https://picsum.photos/600/600?grayscale')] opacity-10 bg-cover bg-center"></div>
                      <h3 className="text-3xl font-serif text-ziwei-gold font-bold mb-2 relative z-10">{userInfo.type}</h3>
                      <p className="text-center text-sm sm:text-base text-gray-300 italic leading-relaxed relative z-10 line-clamp-4">
                        {userInfo.summary}
                      </p>
                      <div className="mt-4 text-xs text-ziwei-accent border border-ziwei-accent px-2 py-1 rounded relative z-10">
                        命盘解析
                      </div>
                    </div>
                  );
                } else {
                  return null; // Skip other center cells
                }
              }

              // Empty placeholder for cells without a palace mapped (robustness)
              if (!cell) {
                 return <div key={`${rIndex}-${cIndex}`} className="bg-white/5 border border-ziwei-purple/20 rounded"></div>;
              }

              // Filter stars for tooltip
              const tooltipStars = cell.stars; // Show all stars
              const hasMajorStars = cell.stars?.some(s => s.type === 'major');

              return (
                <div 
                  key={cell.id} 
                  className="relative h-full group cursor-pointer"
                  onClick={() => setSelectedPalace(cell)}
                >
                  {/* Hover Tooltip (visible on hover) */}
                  <div className="absolute z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 max-h-[60vh] overflow-y-auto custom-scrollbar bg-gray-900/95 border border-ziwei-gold text-ziwei-light text-xs p-3 rounded shadow-2xl pointer-events-none">
                    <div className="flex justify-between items-end mb-2 border-b border-ziwei-gold/30 pb-1">
                       <span className="font-bold text-ziwei-gold text-sm">{cell.name}</span>
                       <span className="text-[10px] text-gray-400 font-serif">{cell.heavenlyStem}{cell.earthlyBranch}宫</span>
                    </div>
                    <div className="mb-3 text-gray-300 leading-snug">{PALACE_DEFINITIONS[cell.name]}</div>
                    
                    {!hasMajorStars && (
                      <div className="mb-2 text-ziwei-accent/80 font-bold border border-ziwei-accent/30 bg-ziwei-accent/10 px-2 py-1 rounded text-center">
                        【空宫】
                      </div>
                    )}

                    {tooltipStars && tooltipStars.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-700/50 space-y-3">
                        {tooltipStars.map((star, idx) => {
                           const style = getStarConfig(star.type);
                           const brightStyle = getBrightnessStyles(star.brightness);
                           const definition = STAR_DEFINITIONS[star.name];
                           
                           return (
                           <div key={idx} className="flex flex-col gap-1">
                             <div className="flex items-center justify-between">
                                 <span className={`font-bold ${style.className} flex items-center gap-1`}>
                                   {/* Added Label here for tooltip as well for consistency */}
                                   <span className={`text-[9px] px-1 rounded border opacity-90 scale-90 ${style.badge}`}>{style.label}</span>
                                   {star.name}
                                 </span>
                                 {star.brightness && (
                                  <span className={`text-[9px] px-2 py-0.5 rounded-full border ${brightStyle}`}>
                                    {star.brightness}
                                  </span>
                                 )}
                             </div>
                             {definition && (
                               <span className="text-gray-400 text-[10px] leading-tight pl-4 border-l-2 border-gray-700 ml-1">
                                 {definition}
                               </span>
                             )}
                           </div>
                        )})}
                      </div>
                    )}

                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-ziwei-gold"></div>
                  </div>

                  {/* Actual Cell Content */}
                  <div className="relative bg-white/5 border border-ziwei-purple/40 group-hover:bg-ziwei-purple/30 group-hover:border-ziwei-gold/50 transition-all duration-200 flex flex-col p-1 sm:p-2 overflow-hidden h-full rounded">
                    
                    {/* Palace Name & Branch */}
                    <div className="absolute bottom-1 right-2 text-xs sm:text-lg font-serif font-bold text-ziwei-gold opacity-80 group-hover:opacity-100 z-10 pointer-events-none">
                      {cell.earthlyBranch}
                    </div>
                    <div className="flex justify-between items-start mb-1 border-b border-white/10 pb-1 group-hover:border-ziwei-gold/30 shrink-0">
                      <span className="text-xs sm:text-sm font-bold bg-ziwei-purple px-1 rounded text-white group-hover:bg-ziwei-accent transition-colors">{cell.name}</span>
                      <span className="text-[10px] text-gray-400 group-hover:text-ziwei-light">{cell.heavenlyStem}</span>
                    </div>

                    {/* Stars in Grid Cell - Scrollable List of All Stars */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar relative pr-0.5 pb-4">
                      {cell.stars && cell.stars.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          {cell.stars.map((star, idx) => {
                            const style = getStarConfig(star.type);
                            return (
                              <div key={idx} className={`flex items-center justify-between text-[10px] leading-none py-0.5`}>
                                <div className={`flex items-center gap-0.5 ${style.className}`}>
                                  {/* Type Label removed to save space, relies on color */}
                                  {/* Or we can keep a tiny dot/icon */}
                                  {star.type === 'major' && <span className="text-red-500 scale-75">●</span>}
                                  <span>{star.name}</span>
                                </div>
                                {star.brightness && (
                                  <span className={`text-[9px] transform scale-90 origin-right ${
                                    ['庙', '旺'].includes(star.brightness) ? 'text-ziwei-gold opacity-100 font-bold' : 'opacity-60 text-gray-500'
                                  }`}>
                                    {star.brightness}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center pointer-events-none opacity-50">
                             <span className="text-[10px] text-gray-600 border border-gray-700/50 rounded px-1.5 py-0.5">空宫</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ))}
        </div>
      </div>

      {/* Modal for Detailed Info */}
      {selectedPalace && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedPalace(null)}>
          <div 
            className="bg-ziwei-dark border-2 border-ziwei-gold rounded-xl p-6 max-w-lg w-full shadow-[0_0_30px_rgba(255,215,0,0.2)] relative transform transition-all scale-100 max-h-[90vh] overflow-y-auto custom-scrollbar" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="absolute top-4 right-4 text-ziwei-light/50 hover:text-white transition-colors"
              onClick={() => setSelectedPalace(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h3 className="text-3xl font-serif font-bold text-ziwei-gold mb-1">
              {selectedPalace.name} 
              <span className="ml-2 text-lg font-normal text-ziwei-light/60">
                 {selectedPalace.heavenlyStem}{selectedPalace.earthlyBranch}宫
              </span>
            </h3>

            {/* General Definition */}
            <div className="mb-6 text-ziwei-light/80 text-sm italic border-l-2 border-ziwei-purple pl-3 py-1">
              {PALACE_DEFINITIONS[selectedPalace.name]}
            </div>

            {/* Stars List in Modal */}
            <div className="mb-6">
               <h4 className="text-ziwei-gold font-bold mb-3 text-sm uppercase tracking-wider border-b border-white/10 pb-1 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-ziwei-accent"></span>
                 星曜组合
               </h4>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   {selectedPalace.stars?.length > 0 ? selectedPalace.stars.map((star, idx) => {
                       const style = getStarConfig(star.type);
                       const brightStyle = getBrightnessStyles(star.brightness);
                       return (
                       <div key={idx} className={`flex flex-col p-3 rounded-lg border transition-all ${style.border}`}>
                           <div className="flex items-center justify-between mb-1">
                               <div className="flex items-center gap-2">
                                   <span className={`font-bold text-sm ${style.className} flex items-center gap-1`}>
                                       {style.icon} {star.name}
                                   </span>
                                   {/* Type Label in Modal - Prominently next to star name */}
                                   <span className={`text-[10px] px-1.5 py-0.5 rounded border opacity-90 whitespace-nowrap ${style.badge}`}>
                                      {style.label}
                                   </span>
                               </div>
                               {star.brightness && (
                                   <span className={`text-xs px-2 py-0.5 rounded-full border ${brightStyle}`}>
                                       {star.brightness}
                                   </span>
                               )}
                           </div>
                           
                           {/* Always show definition if available */}
                           {STAR_DEFINITIONS[star.name] && (
                               <div className="mt-2 text-xs text-gray-300 leading-relaxed border-t border-white/5 pt-2 font-light">
                                   {STAR_DEFINITIONS[star.name]}
                               </div>
                           )}
                       </div>
                   )}) : (
                     <div className="col-span-1 sm:col-span-2 flex flex-col items-center justify-center p-6 bg-white/5 rounded-lg border border-dashed border-gray-600">
                         <span className="text-gray-400 font-bold mb-1">空宫 (无主星)</span>
                         <span className="text-xs text-gray-500">此宫位无甲级主星，运势往往需借对宫（迁移/福德等）星曜来看。</span>
                     </div>
                   )}
               </div>
            </div>
            
            {/* Specific Analysis */}
            <div className="text-ziwei-light leading-relaxed">
               <h4 className="text-ziwei-gold font-bold mb-2 text-sm uppercase tracking-wider border-b border-white/10 pb-1 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-ziwei-accent"></span>
                 宫位详批
               </h4>
               <p className="text-sm sm:text-base text-gray-200 bg-black/20 p-4 rounded-lg">
                 {selectedPalace.description || "暂无详细分析。"}
               </p>
            </div>
            
            <div className="mt-8 text-xs text-center text-gray-600">
              点击背景关闭
            </div>
          </div>
        </div>
      )}
    </>
  );
};