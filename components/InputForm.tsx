import React, { useState, useEffect } from 'react';
import { EARTHLY_BRANCHES, LUNAR_DAYS, LUNAR_MONTHS } from '../constants';
import { Gender, LunarDate } from '../types';

interface InputFormProps {
  onSubmit: (data: LunarDate) => void;
  isLoading: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [year, setYear] = useState<number>(1990);
  const [month, setMonth] = useState<number>(1);
  const [day, setDay] = useState<number>(1);
  const [hour, setHour] = useState<string>('zi');
  const [gender, setGender] = useState<Gender>(Gender.MALE);
  const [isLeap, setIsLeap] = useState<boolean>(false);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);

  // Validate date logic
  useEffect(() => {
    // In Lunar Calendar:
    // Months are either 29 days (Small) or 30 days (Big).
    // Unlike Gregorian (fixed 28/30/31), Lunar month lengths vary by year.
    // Since we don't have a full astronomical library here, we warn the user on Day 30.
    if (day === 30) {
      setValidationMsg("⚠️ 提示：农历月份大小不一（29天或30天）。请确认当年该月确为大月（30天），否则排盘可能存在偏差。");
    } else {
      setValidationMsg(null);
    }
  }, [day, month, year, isLeap]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      year,
      month,
      day,
      hour, // Pass the key directly
      isLeapMonth: isLeap,
      gender,
    });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  return (
    <div className="bg-ziwei-purple/20 border border-ziwei-purple/50 p-6 rounded-xl backdrop-blur-sm max-w-2xl mx-auto shadow-[0_0_15px_rgba(67,44,122,0.5)] transition-all duration-300">
      <h2 className="text-2xl font-serif text-ziwei-gold mb-6 text-center border-b border-ziwei-purple/30 pb-4">
        请输入农历生辰
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Gender Row */}
        <div className="flex justify-center gap-8">
            <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                    type="radio" 
                    name="gender" 
                    value={Gender.MALE} 
                    checked={gender === Gender.MALE} 
                    onChange={() => setGender(Gender.MALE)}
                    className="accent-ziwei-gold w-5 h-5 cursor-pointer"
                />
                <span className="text-lg group-hover:text-ziwei-gold transition-colors">男 (乾造)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                    type="radio" 
                    name="gender" 
                    value={Gender.FEMALE} 
                    checked={gender === Gender.FEMALE} 
                    onChange={() => setGender(Gender.FEMALE)}
                    className="accent-ziwei-gold w-5 h-5 cursor-pointer"
                />
                <span className="text-lg group-hover:text-ziwei-gold transition-colors">女 (坤造)</span>
            </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-ziwei-light/80 text-sm">出生年份 (农历)</label>
            <div className="relative">
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-ziwei-dark border border-ziwei-purple/50 rounded-lg p-3 text-white focus:outline-none focus:border-ziwei-gold appearance-none"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y} 年</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-ziwei-purple">
                 <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-ziwei-light/80 text-sm">月份</label>
            <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full bg-ziwei-dark border border-ziwei-purple/50 rounded-lg p-3 text-white focus:outline-none focus:border-ziwei-gold appearance-none"
                  >
                  {LUNAR_MONTHS.map((m) => (
                      <option key={m} value={m}>{m} 月</option>
                  ))}
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-ziwei-purple">
                     <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 border border-ziwei-purple/30 rounded-lg bg-ziwei-dark/50 cursor-pointer hover:border-ziwei-gold/50 transition-colors" onClick={() => setIsLeap(!isLeap)}>
                    <input 
                        type="checkbox" 
                        checked={isLeap} 
                        onChange={(e) => setIsLeap(e.target.checked)}
                        className="accent-ziwei-gold w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm select-none">闰月</span>
                </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-ziwei-light/80 text-sm">日期</label>
            <div className="relative">
              <select
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
                className={`w-full bg-ziwei-dark border rounded-lg p-3 text-white focus:outline-none appearance-none transition-colors ${validationMsg ? 'border-yellow-500/50 focus:border-yellow-500' : 'border-ziwei-purple/50 focus:border-ziwei-gold'}`}
              >
                {LUNAR_DAYS.map((d) => (
                  <option key={d} value={d}>初{d <= 10 ? d : d}</option>
                ))}
              </select>
               <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-ziwei-purple">
                 <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-ziwei-light/80 text-sm">出生时辰</label>
             <div className="relative">
              <select
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                className="w-full bg-ziwei-dark border border-ziwei-purple/50 rounded-lg p-3 text-white focus:outline-none focus:border-ziwei-gold appearance-none"
              >
                {EARTHLY_BRANCHES.map((b) => (
                  <option key={b.key} value={b.key}>{b.label}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-ziwei-purple">
                 <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Message / Warning */}
        {validationMsg && (
          <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-3 animate-fade-in">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-yellow-200/90 leading-snug">
              {validationMsg}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 text-xl font-bold font-serif tracking-widest rounded-lg shadow-lg transition-all duration-300 ${
            isLoading 
            ? 'bg-gray-600 cursor-not-allowed text-gray-400' 
            : 'bg-gradient-to-r from-ziwei-purple to-ziwei-accent text-white hover:from-ziwei-accent hover:to-ziwei-purple hover:shadow-[0_0_20px_rgba(255,0,127,0.4)] hover:-translate-y-0.5'
          }`}
        >
          {isLoading ? '天机推演中...' : '排盘推算'}
        </button>
      </form>
    </div>
  );
};