
export enum Gender {
  MALE = '男',
  FEMALE = '女',
}

export interface LunarDate {
  year: number;
  month: number;
  day: number;
  hour: string; // Earthly Branch (e.g., "子时")
  isLeapMonth: boolean;
  gender: Gender;
}

export interface Star {
  name: string;
  brightness?: string; // e.g., 庙, 旺, 平, 陷
  type: 'major' | 'minor' | 'bad' | 'good';
}

export interface Palace {
  id: number;
  name: string; // e.g., 命宫, 财帛宫
  earthlyBranch: string; // e.g., 子, 丑
  heavenlyStem: string; // e.g., 甲, 乙
  stars: Star[];
  description: string;
}

export interface TrajectoryPoint {
  ageRange: string; // e.g., "12-21"
  startAge: number;
  score: number; // 0-100 luck score
  summary: string; // Short prediction
  keyEvents: string[];
}

export interface LiuNian {
  year: number;
  ganZhi: string; // e.g., 甲辰
  theme: string; // Short keyword e.g., "Breakthrough"
  score: number;
  summary: string;
  aspects: {
    career: string;
    careerHighlights?: string[]; // Specific events for career
    wealth: string;
    love: string;
    loveHighlights?: string[]; // Specific events for love
    health: string;
  };
}

export interface ZiWeiAnalysis {
  userType: string; // e.g., "紫微坐命格"
  overallLuck: string;
  palaces: Palace[];
  trajectory: TrajectoryPoint[];
  liuNian: LiuNian;
  lifeCautions: string[]; // New field for critical life warnings
}

export interface Bookmark {
  id: number;
  timestamp: number;
  title: string;
  data: ZiWeiAnalysis;
  birthYear?: number;
  note?: string;
}
