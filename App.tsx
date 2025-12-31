
import React, { useState, useEffect, useMemo } from 'react';
import { InputForm } from './components/InputForm';
import { PalaceGrid } from './components/PalaceGrid';
import { TrajectoryChart } from './components/TrajectoryChart';
import { LiuNianSection } from './components/LiuNianSection';
import { generateZiWeiAnalysis } from './services/geminiService';
import { LunarDate, ZiWeiAnalysis, Bookmark } from './types';

// Simple Toast Component
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 z-[110] px-6 py-3 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.5)] border backdrop-blur-md animate-fade-in-up flex items-center gap-3 ${
      type === 'success' 
        ? 'bg-green-900/80 border-green-500 text-green-100' 
        : 'bg-red-900/80 border-red-500 text-red-100'
    }`}>
      {type === 'success' ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

type SortOption = 'date_desc' | 'date_asc' | 'year_desc' | 'year_asc' | 'title_asc' | 'title_desc';

const App: React.FC = () => {
  const [data, setData] = useState<ZiWeiAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentInput, setCurrentInput] = useState<LunarDate | null>(null);
  
  // Bookmark State
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showBookmarksModal, setShowBookmarksModal] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Bookmark Note Editing State
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editNoteContent, setEditNoteContent] = useState<string>('');

  // Filter/Sort State
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');
  const [filterYear, setFilterYear] = useState<string>('');

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ziwei_bookmarks');
    if (saved) {
      try {
        setBookmarks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse bookmarks", e);
      }
    }
  }, []);

  const handleFormSubmit = async (inputData: LunarDate) => {
    setLoading(true);
    setError(null);
    setData(null);
    setCurrentInput(inputData);
    try {
      const result = await generateZiWeiAnalysis(inputData);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Error generating analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const saveBookmark = () => {
    if (!data) return;

    // Optional: Prevent duplicate saving of the exact same chart immediately
    const isDuplicate = bookmarks.length > 0 && 
                        JSON.stringify(bookmarks[0].data) === JSON.stringify(data);

    if (isDuplicate) {
      showToast('该命盘已在收藏夹中', 'error');
      return;
    }

    // Prompt for a note
    let userNote = '';
    // Use window.prompt for simplicity as requested, though a custom modal would be fancier
    const input = window.prompt("为当前命盘添加备注 (可选):", "");
    if (input !== null) {
      userNote = input.trim();
    }

    const newBookmark: Bookmark = {
      id: Date.now(),
      timestamp: Date.now(),
      title: `${data.userType || '未命名'} - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      data: data,
      birthYear: currentInput?.year,
      note: userNote || undefined
    };
    
    const updatedBookmarks = [newBookmark, ...bookmarks];
    setBookmarks(updatedBookmarks);
    localStorage.setItem('ziwei_bookmarks', JSON.stringify(updatedBookmarks));
    showToast('命盘已成功保存至收藏夹', 'success');
  };

  const deleteBookmark = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("确定要删除这条记录吗？")) {
        const updatedBookmarks = bookmarks.filter(b => b.id !== id);
        setBookmarks(updatedBookmarks);
        localStorage.setItem('ziwei_bookmarks', JSON.stringify(updatedBookmarks));
        showToast('已删除收藏记录', 'success');
    }
  };

  const clearAllBookmarks = () => {
    if (window.confirm("确定要清空所有收藏记录吗？此操作不可恢复。")) {
      setBookmarks([]);
      localStorage.removeItem('ziwei_bookmarks');
      showToast('收藏夹已清空', 'success');
    }
  }

  const loadBookmark = (bookmark: Bookmark) => {
    // If we are currently editing a note, don't load the chart on click
    if (editingNoteId === bookmark.id) return;

    setData(bookmark.data);
    setShowBookmarksModal(false);
    // Restore partial input info if available for display purposes
    if (bookmark.birthYear) {
      // Create a dummy input object just for display
      setCurrentInput({
        year: bookmark.birthYear,
        month: 1, day: 1, hour: '', isLeapMonth: false, gender: '男' as any // dummy
      });
    }
    showToast(`已加载: ${bookmark.title}`, 'success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Note Editing Logic
  const startEditingNote = (bookmark: Bookmark, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNoteId(bookmark.id);
    setEditNoteContent(bookmark.note || '');
  };

  const cancelEditingNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNoteId(null);
    setEditNoteContent('');
  };

  const saveEditedNote = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedBookmarks = bookmarks.map(b => 
        b.id === id ? { ...b, note: editNoteContent.trim() || undefined } : b
    );
    setBookmarks(updatedBookmarks);
    localStorage.setItem('ziwei_bookmarks', JSON.stringify(updatedBookmarks));
    setEditingNoteId(null);
    showToast('备注已更新', 'success');
  };


  const filteredBookmarks = useMemo(() => {
    let result = [...bookmarks];

    // Filter by year if entered
    if (filterYear.trim()) {
      const year = parseInt(filterYear);
      if (!isNaN(year)) {
        result = result.filter(b => b.birthYear === year || b.title.includes(filterYear));
      }
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'date_asc':
          return a.timestamp - b.timestamp;
        case 'date_desc':
          return b.timestamp - a.timestamp;
        case 'year_asc':
          return (a.birthYear || 0) - (b.birthYear || 0);
        case 'year_desc':
          return (b.birthYear || 0) - (a.birthYear || 0);
        case 'title_asc':
          return a.title.localeCompare(b.title, 'zh-CN');
        case 'title_desc':
          return b.title.localeCompare(a.title, 'zh-CN');
        default:
          return 0;
      }
    });

    return result;
  }, [bookmarks, sortOption, filterYear]);

  // Helper to calculate Zodiac and GanZhi based on Lunar Year
  const getYearInfo = (year: number) => {
    const stems = ['癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬'];
    const branches = ['亥', '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌'];
    const zodiacs = ['猪', '鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗'];
    
    // Formula for GanZhi roughly starts with 1984 as Jia Zi (Wood Rat)
    const offset = year - 3;
    const stemIndex = offset % 10;
    const branchIndex = offset % 12;
    
    return {
      ganZhi: `${stems[stemIndex]}${branches[branchIndex]}`,
      zodiac: zodiacs[branchIndex]
    };
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a0b2e] via-[#0f0518] to-black text-white p-4 pb-20 overflow-x-hidden">
      
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Header */}
      <header className="text-center py-10 relative">
        {/* View Bookmarks Button */}
        <button 
          onClick={() => setShowBookmarksModal(true)}
          className="absolute top-4 right-4 sm:top-8 sm:right-8 flex items-center gap-2 bg-ziwei-purple/30 hover:bg-ziwei-purple/60 border border-ziwei-gold/30 text-ziwei-gold px-4 py-2 rounded-full text-sm transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
          </svg>
          <span className="hidden sm:inline">我的收藏 ({bookmarks.length})</span>
        </button>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-ziwei-purple/20 blur-[100px] rounded-full -z-10"></div>
        <h1 className="text-5xl md:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-ziwei-gold to-yellow-700 tracking-wider mb-2">
          紫微斗数
        </h1>
        <p className="text-ziwei-light/70 text-lg tracking-[0.2em] uppercase font-light">
          Life Trajectory & Destiny Chart
        </p>

        {/* Display Zodiac Year Info if Input Exists */}
        {currentInput && (
           <div className="mt-6 animate-fade-in">
              <span className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-ziwei-gold/5 border border-ziwei-gold/40 text-ziwei-gold font-serif text-lg tracking-widest shadow-[0_0_15px_rgba(255,215,0,0.1)] hover:bg-ziwei-gold/10 transition-colors cursor-default">
                 <span className="text-2xl" role="img" aria-label="zodiac">{
                    // Mapping emoji manually for better visuals, or just text
                    {
                        '鼠': '🐭', '牛': '🐮', '虎': '🐯', '兔': '🐰', '龙': '🐲', '蛇': '🐍',
                        '马': '🐴', '羊': '🐏', '猴': '🐵', '鸡': '🐔', '狗': '🐶', '猪': '🐷'
                    }[getYearInfo(currentInput.year).zodiac]
                 }</span>
                 <span>{currentInput.year} {getYearInfo(currentInput.year).ganZhi} · {getYearInfo(currentInput.year).zodiac}年</span>
              </span>
           </div>
        )}
      </header>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto space-y-12">
        
        {/* Input Section */}
        <section className="relative z-10">
          <InputForm onSubmit={handleFormSubmit} isLoading={loading} />
        </section>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg text-center max-w-2xl mx-auto animate-fade-in">
            {error}
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
             <div className="w-16 h-16 border-4 border-ziwei-purple border-t-ziwei-gold rounded-full animate-spin"></div>
             <p className="text-ziwei-gold animate-pulse text-lg font-serif">正在排盘推演天机...</p>
          </div>
        )}

        {/* Results Section */}
        {data && !loading && (
          <div className="animate-fade-in-up space-y-16 relative">
            
            {/* Action Bar */}
            <div className="flex justify-end border-b border-ziwei-purple/30 pb-4">
              <button 
                onClick={saveBookmark}
                className="flex items-center gap-2 bg-gradient-to-r from-ziwei-accent to-ziwei-purple hover:to-ziwei-accent text-white px-6 py-2 rounded shadow-lg transition-all transform hover:scale-105"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
                收藏当前命盘
              </button>
            </div>

            {/* 1. Life Trajectory Chart (1-100 Years) */}
            <TrajectoryChart data={data.trajectory} />

            {/* 2. Traditional Grid (12 Palaces) */}
            <div>
               <h3 className="text-center text-2xl font-serif text-ziwei-gold mb-6 relative inline-block left-1/2 -translate-x-1/2">
                <span className="border-b-2 border-ziwei-accent pb-2 px-4">十二宫位星宿排列</span>
               </h3>
               <PalaceGrid 
                 palaces={data.palaces} 
                 userInfo={{ type: data.userType, summary: data.overallLuck }} 
               />
            </div>
            
            {/* 3. Detailed Trajectory List (Text) */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.trajectory?.map((t, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-lg hover:border-ziwei-gold/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xl font-bold text-ziwei-gold">{t.ageRange} 岁</span>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${t.score >= 80 ? 'bg-green-900 text-green-300' : t.score >= 60 ? 'bg-yellow-900 text-yellow-300' : 'bg-red-900 text-red-300'}`}>
                                运势分: {t.score}
                            </span>
                        </div>
                        <p className="text-gray-300 mb-4 font-serif leading-relaxed">{t.summary}</p>
                        <div className="flex flex-wrap gap-2">
                            {t.keyEvents?.map((k, idx) => (
                                <span key={idx} className="text-xs bg-ziwei-purple/40 text-ziwei-light px-2 py-1 rounded-full border border-ziwei-purple/50">
                                    {k}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
             </div>

             {/* 4. Future 10 Years Liu Nian (With Focus on Career/Love) */}
            {data.liuNian && (
                <div className="mt-8">
                    <h3 className="text-2xl font-serif text-ziwei-gold mb-6 border-l-4 border-ziwei-accent pl-3">未来十年流年推演 (重点关注事业与感情)</h3>
                    <LiuNianSection 
                        initialData={data.liuNian} 
                        userInfo={currentInput || undefined}
                        palaces={data.palaces}
                    />
                </div>
            )}

            {/* 5. Life Cautions (人生注意事项) - NEW SECTION */}
            {data.lifeCautions && data.lifeCautions.length > 0 && (
              <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-600/30 rounded-xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <h3 className="text-2xl font-serif text-yellow-500 mb-6 flex items-center gap-3 relative z-10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  人生注意事项
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                  {data.lifeCautions.map((caution, index) => (
                    <div key={index} className="flex items-start gap-3 bg-black/20 p-4 rounded-lg border border-yellow-600/10">
                      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-yellow-600/20 text-yellow-500 font-bold text-sm">
                        {index + 1}
                      </span>
                      <p className="text-gray-200 leading-relaxed font-serif">
                        {caution}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </main>

       {/* Footer */}
       <footer className="text-center text-ziwei-light/30 mt-20 text-sm">
        <p>© 2024 Zi Wei Life Trajectory. Powered by Gemini AI.</p>
        <p className="text-xs mt-1">此内容仅供娱乐参考，请勿用于重大决策。</p>
      </footer>

      {/* Bookmarks Modal */}
      {showBookmarksModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowBookmarksModal(false)}>
          <div 
            className="bg-ziwei-dark border-2 border-ziwei-gold/50 rounded-xl p-6 max-w-2xl w-full shadow-2xl relative max-h-[80vh] overflow-y-auto custom-scrollbar flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
             <div className="flex justify-between items-center mb-6 border-b border-ziwei-purple/50 pb-4 shrink-0">
               <h3 className="text-2xl font-serif text-ziwei-gold">收藏的命盘</h3>
               <button onClick={() => setShowBookmarksModal(false)} className="text-gray-400 hover:text-white">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>

             {/* Filters and Sort Controls */}
             <div className="grid grid-cols-2 gap-4 mb-4 shrink-0">
               <div className="relative">
                 <input 
                   type="text" 
                   placeholder="筛选年份..." 
                   value={filterYear}
                   onChange={(e) => setFilterYear(e.target.value)}
                   className="w-full bg-white/5 border border-ziwei-purple/30 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-ziwei-gold"
                 />
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                 </svg>
               </div>
               <div>
                 <select 
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="w-full bg-white/5 border border-ziwei-purple/30 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-ziwei-gold"
                 >
                   <option value="date_desc">添加时间 (最新)</option>
                   <option value="date_asc">添加时间 (最早)</option>
                   <option value="year_desc">出生年份 (降序)</option>
                   <option value="year_asc">出生年份 (升序)</option>
                   <option value="title_asc">标题 (A-Z)</option>
                   <option value="title_desc">标题 (Z-A)</option>
                 </select>
               </div>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredBookmarks.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <p className="mb-2">暂无符合条件的收藏记录</p>
                  {bookmarks.length === 0 && <p className="text-sm">计算命盘后点击"收藏"按钮即可保存</p>}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBookmarks.map((bookmark) => (
                    <div key={bookmark.id} className="bg-white/5 border border-ziwei-purple/30 rounded-lg p-4 flex flex-col gap-3 hover:bg-ziwei-purple/20 transition-colors group">
                      <div className="flex justify-between items-start">
                        <div 
                          className="cursor-pointer flex-1"
                          onClick={() => loadBookmark(bookmark)}
                        >
                          <h4 className="font-bold text-ziwei-light text-lg mb-1 group-hover:text-ziwei-gold transition-colors flex items-center gap-2 flex-wrap">
                            {bookmark.title}
                            {bookmark.birthYear && <span className="text-xs text-ziwei-gold/70 bg-ziwei-gold/10 px-2 py-0.5 rounded-full whitespace-nowrap">{bookmark.birthYear}年</span>}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {new Date(bookmark.timestamp).toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                           <button 
                            onClick={(e) => startEditingNote(bookmark, e)}
                            className="text-gray-500 hover:text-ziwei-gold transition-colors p-2"
                            title="编辑备注"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => loadBookmark(bookmark)}
                            className="px-3 py-1 bg-ziwei-purple text-xs rounded hover:bg-ziwei-accent transition-colors text-white whitespace-nowrap"
                          >
                            查看
                          </button>
                          <button 
                            onClick={(e) => deleteBookmark(bookmark.id, e)}
                            className="text-gray-500 hover:text-red-400 transition-colors p-2"
                            title="删除"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Note Section */}
                      {editingNoteId === bookmark.id ? (
                        <div className="mt-1 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                           <textarea
                             value={editNoteContent}
                             onChange={(e) => setEditNoteContent(e.target.value)}
                             placeholder="添加备注..."
                             className="w-full bg-black/20 border border-ziwei-purple/50 rounded p-2 text-sm text-white focus:outline-none focus:border-ziwei-gold mb-2 resize-none h-20"
                             autoFocus
                           />
                           <div className="flex justify-end gap-2">
                              <button 
                                onClick={(e) => cancelEditingNote(e)}
                                className="px-3 py-1 text-xs text-gray-400 hover:text-white"
                              >
                                取消
                              </button>
                              <button 
                                onClick={(e) => saveEditedNote(bookmark.id, e)}
                                className="px-3 py-1 bg-ziwei-accent text-xs rounded text-white hover:bg-ziwei-accent/80"
                              >
                                保存备注
                              </button>
                           </div>
                        </div>
                      ) : (
                        bookmark.note && (
                            <div className="text-sm text-gray-300/80 bg-black/20 p-2 rounded border-l-2 border-ziwei-gold/50 italic flex items-start gap-2">
                                <span className="text-ziwei-gold/50 text-xs mt-0.5">Note:</span>
                                {bookmark.note}
                            </div>
                        )
                      )}

                    </div>
                  ))}
                </div>
              )}
             </div>

             {bookmarks.length > 0 && (
               <div className="mt-6 pt-4 border-t border-ziwei-purple/30 flex justify-end shrink-0">
                  <button 
                    onClick={clearAllBookmarks}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    清空所有收藏
                  </button>
               </div>
             )}
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
