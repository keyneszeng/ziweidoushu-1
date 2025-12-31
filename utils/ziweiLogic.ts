import { EARTHLY_BRANCHES, HEAVENLY_STEMS, PALACE_NAMES } from "../constants";
import { Palace, Star } from "../types";

// Types
export interface ChartSkeleton {
  palaces: Palace[];
  lifePalaceIndex: number;
  bodyPalaceIndex: number; // Shen Gong
  bureau: string; // Five Element Bureau
}

// --- 1. Five Element Bureau (Na Yin) Full Lookup ---
// Ordered by 60 Jia Zi (Stem 0-9, Branch 0-11)
// Key = StemName + BranchName
const NA_YIN_BUREAU: Record<string, string> = {
  // Metal 4 (金四局)
  '甲子': '金四局', '乙丑': '金四局', '壬申': '金四局', '癸酉': '金四局', 
  '庚辰': '金四局', '辛巳': '金四局', '甲午': '金四局', '乙未': '金四局',
  '壬寅': '金四局', '癸卯': '金四局', '庚戌': '金四局', '辛亥': '金四局',
  
  // Water 2 (水二局)
  '丙子': '水二局', '丁丑': '水二局', '甲申': '水二局', '乙酉': '水二局',
  '壬辰': '水二局', '癸巳': '水二局', '丙午': '水二局', '丁未': '水二局',
  '甲寅': '水二局', '乙卯': '水二局', '壬戌': '水二局', '癸亥': '水二局',
  
  // Fire 6 (火六局)
  '戊子': '火六局', '己丑': '火六局', '丙申': '火六局', '丁酉': '火六局',
  '甲辰': '火六局', '乙巳': '火六局', '戊午': '火六局', '己未': '火六局',
  '丙寅': '火六局', '丁卯': '火六局', '甲戌': '火六局', '乙亥': '火六局',
  
  // Earth 5 (土五局)
  '庚子': '土五局', '辛丑': '土五局', '戊申': '土五局', '己酉': '土五局',
  '丙辰': '土五局', '丁巳': '土五局', '庚午': '土五局', '辛未': '土五局',
  '戊寅': '土五局', '己卯': '土五局', '丙戌': '土五局', '丁亥': '土五局',
  
  // Wood 3 (木三局)
  '壬子': '木三局', '癸丑': '木三局', '庚申': '木三局', '辛酉': '木三局',
  '戊辰': '木三局', '己巳': '木三局', '壬午': '木三局', '癸未': '木三局',
  '庚寅': '木三局', '辛卯': '木三局', '戊戌': '木三局', '己亥': '木三局',
};

const getBureau = (stem: string, branch: string): number => {
  const bureauStr = NA_YIN_BUREAU[`${stem}${branch}`];
  if (bureauStr === '水二局') return 2;
  if (bureauStr === '木三局') return 3;
  if (bureauStr === '金四局') return 4;
  if (bureauStr === '土五局') return 5;
  if (bureauStr === '火六局') return 6;
  return 2; // Default fallback
};

const getBureauName = (num: number): string => {
  const map: Record<number, string> = { 2: '水二局', 3: '木三局', 4: '金四局', 5: '土五局', 6: '火六局' };
  return map[num];
};

// --- 2. Ziwei Star Location Algorithm (Standard Remainder Method) ---
const getZiweiLocation = (day: number, bureau: number): number => {
  // Logic: 
  // If (Day % Bureau == 0), Quotient Q = Day/Bureau. Pos = Yin(2) + Q - 1.
  // If (Day % Bureau != 0), Q = (Day/Bureau) + 1. Remainder R = Bureau - (Day % Bureau).
  //    If R is odd: Pos = Yin(2) + Q - 1 - R.
  //    If R is even: Pos = Yin(2) + Q - 1 + R.
  
  let q: number, r: number, pos: number;
  
  if (day % bureau === 0) {
      q = Math.floor(day / bureau);
      // Start at Yin (Index 2). Steps = Q - 1.
      pos = 2 + (q - 1);
  } else {
      q = Math.floor(day / bureau) + 1;
      let remainder = day % bureau;
      let diff = (q * bureau) - day; // The amount added to make it divisible
      // Note: The logic R is slightly different in texts, but "Diff" is what we want.
      // If Diff is odd => Go Back (CCW)
      // If Diff is even => Go Forward (CW)
      
      let basePos = 2 + (q - 1);
      
      if (diff % 2 === 1) {
          pos = basePos - diff;
      } else {
          pos = basePos + diff;
      }
  }

  // Normalize to 0-11
  let index = pos % 12;
  if (index < 0) index += 12;
  return index;
};

// --- 3. Star Group Offsets ---
// Ziwei Group (CCW): Ziwei(0), Tianji(1), Taiyang(3), Wuqu(4), Tiantong(5), Lianzhen(8)
const ZIWEI_GROUP = [
  { name: '紫微', offset: 0 },
  { name: '天机', offset: -1 },
  { name: '太阳', offset: -3 },
  { name: '武曲', offset: -4 },
  { name: '天同', offset: -5 },
  { name: '廉贞', offset: -8 },
];

// Tianfu Group (CW): Tianfu(0), Taiyin(1), Tanlang(2), Jumen(3), Tianxiang(4), Tianliang(5), Qisha(6), Pojun(10)
const TIANFU_GROUP = [
  { name: '天府', offset: 0 },
  { name: '太阴', offset: 1 },
  { name: '贪狼', offset: 2 },
  { name: '巨门', offset: 3 },
  { name: '天相', offset: 4 },
  { name: '天梁', offset: 5 },
  { name: '七杀', offset: 6 },
  { name: '破军', offset: 10 },
];

// Helper to normalize index 0-11
const norm = (idx: number) => {
  let res = idx % 12;
  return res < 0 ? res + 12 : res;
};

// --- Main Calculation Function ---
export const calculateZiweiChart = (
    year: number,
    month: number,
    day: number,
    hourKey: string
): ChartSkeleton => {
    // 1. Basic Params
    const yearStemIndex = (year - 4 + 600) % 10; // 0=Jia
    const yearBranchIndex = (year - 4 + 600) % 12; // 0=Zi(Rat)
    const hourIndex = EARTHLY_BRANCHES.findIndex(b => b.key === hourKey);

    // 2. Ming (Life) & Shen (Body) Placement
    // Ming: Yin(2) + Month - 1 - Hour
    const mingIndex = norm(2 + (month - 1) - hourIndex);
    // Shen: Yin(2) + Month - 1 + Hour (Lu Binzhao Rule)
    const bodyIndex = norm(2 + (month - 1) + hourIndex);

    // 3. Palace Stems (Five Tigers Chasing Month - Wu Hu Dun)
    // Year Stem -> Yin Palace Stem
    // Jia(0)/Ji(5) -> Bing(2) Yin
    // Yi(1)/Geng(6) -> Wu(4) Yin
    // Bing(2)/Xin(7) -> Geng(6) Yin
    // Ding(3)/Ren(8) -> Ren(8) Yin
    // Wu(4)/Gui(9) -> Jia(0) Yin
    const YEAR_STEM_TO_YIN_STEM: Record<number, number> = {
        0: 2, 1: 4, 2: 6, 3: 8, 4: 0, 
        5: 2, 6: 4, 7: 6, 8: 8, 9: 0
    };
    const startStemIndex = YEAR_STEM_TO_YIN_STEM[yearStemIndex];
    
    // 4. Build Palaces
    let palaces: Palace[] = [];
    for (let i = 0; i < 12; i++) {
        // Grid Index i (0=Zi, 1=Chou...)
        // We need to find which Palace Type (Ming, Siblings...) sits at this Grid Index.
        // If Ming is at mingIndex, then Ming(0) is at mingIndex.
        // Siblings(1) is at mingIndex - 1.
        // PalaceType P at Grid G: G = mingIndex - P.
        // So P = mingIndex - G.
        
        let pTypeIndex = (mingIndex - i);
        if (pTypeIndex < 0) pTypeIndex += 12;
        
        // Stem for this Grid Index
        // Yin is Index 2. StartStemIndex is at Index 2.
        // Stem at i = startStemIndex + (i - 2)
        const stemIndex = (startStemIndex + (i - 2));
        const normalizedStem = stemIndex % 10 < 0 ? (stemIndex % 10) + 10 : stemIndex % 10;
        
        palaces.push({
            id: i,
            name: PALACE_NAMES[pTypeIndex],
            earthlyBranch: EARTHLY_BRANCHES[i].name,
            heavenlyStem: HEAVENLY_STEMS[normalizedStem],
            stars: [],
            description: ''
        });
    }

    // 5. Determine Bureau (Five Element)
    const mingPalace = palaces[mingIndex];
    const bureauNum = getBureau(mingPalace.heavenlyStem, mingPalace.earthlyBranch);

    // --- 6. Star Placement (An Xing) ---
    
    // A. Major Stars
    const ziweiIndex = getZiweiLocation(day, bureauNum);
    
    // Tianfu is relative to the Yin-Shen axis (Tiger-Monkey)
    // Formula: Tianfu = (12 - Ziwei) + 4? No.
    // Standard: Tianfu = 4 - Ziwei (where Zi=0).
    const tianfuIndex = norm(4 - ziweiIndex);

    // Add Ziwei Group
    ZIWEI_GROUP.forEach(s => {
        const idx = norm(ziweiIndex + s.offset);
        palaces[idx].stars.push({ name: s.name, type: 'major' });
    });

    // Add Tianfu Group
    TIANFU_GROUP.forEach(s => {
        const idx = norm(tianfuIndex + s.offset);
        palaces[idx].stars.push({ name: s.name, type: 'major' });
    });

    // B. Hourly Stars
    // WenChang: Xu(10) - (Hour - 1). (Hour 0=Zi=1st) -> 10 - 0 = 10.
    const wenChangIndex = norm(10 - hourIndex);
    palaces[wenChangIndex].stars.push({ name: '文昌', type: 'good' });

    // WenQu: Chen(4) + (Hour - 1). -> 4 + 0 = 4.
    const wenQuIndex = norm(4 + hourIndex);
    palaces[wenQuIndex].stars.push({ name: '文曲', type: 'good' });

    // DiKong: Hai(11) - (Hour - 1). -> 11 - 0 = 11.
    const diKongIndex = norm(11 - hourIndex);
    palaces[diKongIndex].stars.push({ name: '地空', type: 'bad' });
    
    // DiJie: Hai(11) + (Hour - 1). -> 11 + 0 = 11.
    const diJieIndex = norm(11 + hourIndex);
    palaces[diJieIndex].stars.push({ name: '地劫', type: 'bad' });

    // C. Monthly Stars
    // ZuoFu: Chen(4) + (Month - 1).
    const zuoFuIndex = norm(4 + (month - 1));
    palaces[zuoFuIndex].stars.push({ name: '左辅', type: 'good' });

    // YouBi: Xu(10) - (Month - 1).
    const youBiIndex = norm(10 - (month - 1));
    palaces[youBiIndex].stars.push({ name: '右弼', type: 'good' });

    // D. Yearly Stars (Lu Cun & Si Hua Origins)
    // LuCun Mapping (Year Stem):
    // Jia(0)->Yin(2), Yi(1)->Mao(3), Bing(2)/Wu(4)->Si(5), Ding(3)/Ji(5)->Wu(6),
    // Geng(6)->Shen(8), Xin(7)->You(9), Ren(8)->Hai(11), Gui(9)->Zi(0)
    const LUCUN_MAP: Record<number, number> = {
        0: 2, 1: 3, 2: 5, 3: 6, 4: 5, 5: 6, 6: 8, 7: 9, 8: 11, 9: 0
    };
    const luCunIndex = LUCUN_MAP[yearStemIndex];
    if (luCunIndex !== undefined) {
        palaces[luCunIndex].stars.push({ name: '禄存', type: 'good' });
        // QingYang (Sheep) = Lu + 1 (Forward)
        palaces[norm(luCunIndex + 1)].stars.push({ name: '擎羊', type: 'bad' });
        // TuoLuo (Dala) = Lu - 1 (Backward)
        palaces[norm(luCunIndex - 1)].stars.push({ name: '陀罗', type: 'bad' });
    }

    // TianKui / TianYue (Noblemen)
    // Formula based on Lu Binzhao:
    // Jia/Wu/Geng -> Chou(1) / Wei(7)
    // Yi/Ji -> Zi(0) / Shen(8)
    // Bing/Ding -> Hai(11) / You(9)
    // Ren/Gui -> Si(5) / Mao(3)
    // Xin -> Wu(6) / Yin(2)
    const KUI_YUE_MAP: Record<number, [number, number]> = {
        0: [1, 7], 4: [1, 7], 6: [1, 7], // Jia, Wu, Geng (Geng uses Chou/Wei in Lu Binzhao)
        1: [0, 8], 5: [0, 8], // Yi, Ji
        2: [11, 9], 3: [11, 9], // Bing, Ding
        8: [5, 3], 9: [5, 3], // Ren, Gui
        7: [6, 2] // Xin
    };
    const [kui, yue] = KUI_YUE_MAP[yearStemIndex] || [1, 7];
    palaces[kui].stars.push({ name: '天魁', type: 'good' });
    palaces[yue].stars.push({ name: '天钺', type: 'good' });

    // E. Huo Xing / Ling Xing (Fire / Bell) - Lu Binzhao Method
    // Based on Year Branch (San He)
    // Yin/Wu/Xu (2,6,10): Huo starts Chou(1), Ling starts Mao(3)
    // Shen/Zi/Chen (8,0,4): Huo starts Yin(2), Ling starts Xu(10)
    // Si/You/Chou (5,9,1): Huo starts Mao(3), Ling starts Xu(10)
    // Hai/Mao/Wei (11,3,7): Huo starts You(9), Ling starts Xu(10)
    // Direction: Clockwise to Hour
    
    let huoBase = 1; 
    let lingBase = 3;
    
    // Group 1: Yin(2), Wu(6), Xu(10)
    if ([2, 6, 10].includes(yearBranchIndex)) {
        huoBase = 1; // Chou
        lingBase = 3; // Mao
    }
    // Group 2: Shen(8), Zi(0), Chen(4)
    else if ([8, 0, 4].includes(yearBranchIndex)) {
        huoBase = 2; // Yin
        lingBase = 10; // Xu
    }
    // Group 3: Si(5), You(9), Chou(1)
    else if ([5, 9, 1].includes(yearBranchIndex)) {
        huoBase = 3; // Mao
        lingBase = 10; // Xu
    }
    // Group 4: Hai(11), Mao(3), Wei(7)
    else if ([11, 3, 7].includes(yearBranchIndex)) {
        huoBase = 9; // You
        lingBase = 10; // Xu
    }
    
    // Calculate final position: Base + HourIndex (0-based)
    palaces[norm(huoBase + hourIndex)].stars.push({ name: '火星', type: 'bad' });
    palaces[norm(lingBase + hourIndex)].stars.push({ name: '铃星', type: 'bad' });

    // F. Tian Ma (Heavenly Horse)
    // Based on Year Branch
    // Yin/Wu/Xu -> Shen(8)
    // Shen/Zi/Chen -> Yin(2)
    // Si/You/Chou -> Hai(11)
    // Hai/Mao/Wei -> Si(5)
    let tianMaIndex = 2;
    if ([2, 6, 10].includes(yearBranchIndex)) tianMaIndex = 8;
    else if ([8, 0, 4].includes(yearBranchIndex)) tianMaIndex = 2;
    else if ([5, 9, 1].includes(yearBranchIndex)) tianMaIndex = 11;
    else if ([11, 3, 7].includes(yearBranchIndex)) tianMaIndex = 5;
    
    palaces[tianMaIndex].stars.push({ name: '天马', type: 'good' });

    // G. Minor Stars (HongLuan, TianXi)
    // HongLuan: Mao(3) CCW to Year Branch.
    const hongLuanIndex = norm(3 - yearBranchIndex);
    palaces[hongLuanIndex].stars.push({ name: '红鸾', type: 'minor' });
    // TianXi: Opposite HongLuan.
    palaces[norm(hongLuanIndex + 6)].stars.push({ name: '天喜', type: 'minor' });

    return {
        palaces,
        lifePalaceIndex: mingIndex,
        bodyPalaceIndex: bodyIndex,
        bureau: getBureauName(bureauNum)
    };
};
