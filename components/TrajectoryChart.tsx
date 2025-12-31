import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { TrajectoryPoint } from '../types';

interface TrajectoryChartProps {
  data: TrajectoryPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data: TrajectoryPoint = payload[0].payload;
    return (
      <div className="bg-ziwei-dark border border-ziwei-gold p-4 rounded shadow-xl max-w-xs z-50">
        <p className="font-bold text-ziwei-gold mb-2">{data.ageRange}岁 (大限)</p>
        <p className="text-white text-sm mb-2">运势评分: <span className="text-ziwei-accent font-bold">{data.score}</span></p>
        <p className="text-gray-300 text-xs italic mb-2">{data.summary}</p>
        <div className="border-t border-gray-700 pt-2 mt-2">
            <p className="text-xs text-gray-400 font-bold mb-1">关键点:</p>
            {data.keyEvents && data.keyEvents.length > 0 ? (
                <ul className="list-disc list-inside text-xs text-gray-400">
                    {data.keyEvents.map((evt, idx) => (
                        <li key={idx}>{evt}</li>
                    ))}
                </ul>
            ) : (
                <span className="text-xs text-gray-600 italic">无特别重大事件</span>
            )}
        </div>
      </div>
    );
  }
  return null;
};

const CustomizedDot = (props: any) => {
    const { cx, cy, payload } = props;
    const hasEvents = payload.keyEvents && payload.keyEvents.length > 0;

    if (!hasEvents) {
        // Render a small, subtle dot for regular points
        return <circle cx={cx} cy={cy} r={3} fill="#1a0b2e" stroke="#ff007f" strokeWidth={1.5} opacity={0.6} />;
    }

    // Render a prominent, pulsing marker for key events
    return (
        <g>
            {/* Animated Glow */}
            <circle cx={cx} cy={cy} r={8} fill="#ffd700" opacity="0.4">
                <animate attributeName="r" from="8" to="14" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* Outer static ring */}
            <circle cx={cx} cy={cy} r={6} fill="#1a0b2e" stroke="#ffd700" strokeWidth={2} />
            {/* Inner solid dot */}
            <circle cx={cx} cy={cy} r={3} fill="#ff007f" />
        </g>
    );
};

const CustomizedActiveDot = (props: any) => {
    const { cx, cy, payload } = props;
    const hasEvents = payload.keyEvents && payload.keyEvents.length > 0;

    if (hasEvents) {
        return (
            <g>
                <circle cx={cx} cy={cy} r={10} fill="#ffd700" fillOpacity={0.3} stroke="#ffd700" strokeWidth={1} />
                <circle cx={cx} cy={cy} r={5} fill="#1a0b2e" stroke="#ff007f" strokeWidth={2} />
            </g>
        );
    }
    return <circle cx={cx} cy={cy} r={6} stroke="#ff007f" strokeWidth={2} fill="#1a0b2e" />;
};

export const TrajectoryChart: React.FC<TrajectoryChartProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-ziwei-dark/50 p-6 rounded-xl border border-ziwei-purple/30 backdrop-blur-sm mt-8">
      <h3 className="text-xl font-serif text-ziwei-gold mb-6 border-l-4 border-ziwei-accent pl-3 flex items-center gap-2">
        大限运势轨迹 (Life Trajectory)
        <span className="text-xs font-sans font-normal text-gray-500 border border-gray-700 px-2 py-0.5 rounded-full bg-black/30">
           <span className="inline-block w-2 h-2 rounded-full bg-ziwei-gold mr-1 animate-pulse"></span>
           含关键事件
        </span>
      </h3>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff007f" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#432c7a" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d1b4e" vertical={false} />
            <XAxis 
                dataKey="startAge" 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickFormatter={(val) => `${val}`}
                label={{ value: '起始年龄', position: 'insideBottomRight', offset: -5, fill: '#6b7280', fontSize: 10 }}
                stroke="#4b5563"
                tickLine={false}
                axisLine={{ stroke: '#4b5563' }}
            />
            <YAxis 
                domain={[0, 100]} 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                stroke="#4b5563"
                tickLine={false}
                axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffd700', strokeWidth: 1, strokeDasharray: '5 5' }} />
            <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#ff007f" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorScore)" 
                animationDuration={2000}
                dot={<CustomizedDot />}
                activeDot={<CustomizedActiveDot />}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
        <span>* 图表展示每十年大限的运势评分波动</span>
        <div className="flex items-center gap-4">
             <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full border border-ziwei-gold bg-ziwei-dark relative flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-ziwei-accent rounded-full"></span>
                </span>
                <span>关键事件节点</span>
             </div>
             <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full border border-ziwei-accent bg-ziwei-dark"></span>
                <span>普通大限</span>
             </div>
        </div>
      </div>
    </div>
  );
};