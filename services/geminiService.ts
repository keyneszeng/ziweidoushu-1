
import { GoogleGenAI, Type } from "@google/genai";
import { LunarDate, ZiWeiAnalysis, LiuNian, Palace } from "../types";
import { calculateZiweiChart } from "../utils/ziweiLogic";

const GEMINI_API_KEY = process.env.API_KEY || '';

// Initialize AI Client
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Robust helper to extract retry time from error object
const extractRetryDelay = (error: any): number | null => {
  // 1. Check structured Google RPC error details for RetryInfo (most reliable)
  const details = error?.details || error?.error?.details || error?.response?.data?.error?.details; 
  
  if (Array.isArray(details)) {
    const retryInfo = details.find((d: any) => d['@type']?.includes('RetryInfo'));
    if (retryInfo && retryInfo.retryDelay) {
      const val = parseFloat(retryInfo.retryDelay.replace('s', ''));
      if (!isNaN(val)) {
         return Math.ceil(val * 1000);
      }
    }
  }

  // 2. Fallback to Regex on message string
  const message = error.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
  const match = message.match(/retry in ([0-9.]+)(s|ms)/i);
  if (match && match[1]) {
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    if (unit === 's') return Math.ceil(value * 1000);
    if (unit === 'ms') return Math.ceil(value);
  }
  
  return null;
};

// Helper for Exponential Backoff Retry
async function generateWithRetry<T>(
  operation: () => Promise<T>,
  retries: number = 3,
  delay: number = 2000
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    const code = error.status || error.code || error.error?.code;
    const message = error.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));

    // 1. Handle API Key Errors (Fail Fast)
    if (code === 400 || message.includes("API key expired") || message.includes("API_KEY_INVALID")) {
        throw new Error("API_KEY_INVALID"); // Throw specific code to handle fallback immediately
    }

    const isRateLimited = code === 429 || message.includes("429") || message.includes("quota") || message.includes("RESOURCE_EXHAUSTED");
    const isServerBusy = code === 503 || message.includes("503") || message.includes("overloaded");
    const isServerError = code === 500 || (typeof code === 'number' && code >= 500);

    if (retries > 0 && (isRateLimited || isServerBusy || isServerError)) {
      let waitTime = delay;

      if (isRateLimited) {
        const serverSuggestedDelay = extractRetryDelay(error);
        if (serverSuggestedDelay) {
           console.warn(`Quota Exceeded. Server requested wait: ${serverSuggestedDelay}ms`);
           waitTime = serverSuggestedDelay + 2000;
        } else {
           waitTime = delay * 2;
        }
      } else if (isServerBusy) {
         waitTime = delay * 1.5;
      }
      
      console.warn(`API Error (${code}). Retrying in ${Math.round(waitTime/1000)}s... (Retries left: ${retries})`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      const nextBaseDelay = (isRateLimited && extractRetryDelay(error)) ? delay : waitTime;
      return generateWithRetry(operation, retries - 1, nextBaseDelay);
    }
    
    throw error;
  }
}

// Fallback Generator
const generateFallbackAnalysis = (data: LunarDate, chart: any): ZiWeiAnalysis => {
  const bureauMap: Record<string, number> = {
    '水二局': 2, '木三局': 3, '金四局': 4, '土五局': 5, '火六局': 6
  };
  const startAge = bureauMap[chart.bureau] || 2;
  
  const trajectory = [];
  // Ensure we cover up to ~100 years (10 decades)
  for(let i=0; i<10; i++) {
     const start = startAge + (i*10);
     const end = start + 9;
     trajectory.push({
       ageRange: `${start}-${end}`,
       startAge: start,
       score: 60, 
       summary: "离线模式：大限运势分析暂不可用。",
       keyEvents: []
     });
  }

  const currentYear = new Date().getFullYear();

  return {
    userType: `${chart.bureau} (离线模式)`,
    overallLuck: "【系统提示】由于 AI 服务当前不可用（API 配额超限或密钥无效），系统已自动切换至离线模式。下方的命盘星曜排列完全基于紫微斗数排盘算法生成，准确无误，您仍可依据星曜组合进行参考，但无法提供 AI 智能解读。",
    palaces: chart.palaces.map((p: any) => ({
      ...p,
      description: "AI 解读暂时无法获取。"
    })),
    trajectory,
    liuNian: {
      year: currentYear,
      ganZhi: "",
      theme: "待定",
      score: 60,
      summary: "离线模式无法推演流年详情。",
      aspects: {
        career: "暂无数据",
        wealth: "暂无数据",
        love: "暂无数据",
        health: "暂无数据"
      }
    },
    lifeCautions: [
      "离线模式：无法提供个性化人生警示。",
      "建议：保持身心健康，谨慎投资。",
      "提示：请检查网络或 API Key 后重试。"
    ]
  };
};

export const generateZiWeiAnalysis = async (data: LunarDate): Promise<ZiWeiAnalysis> => {
  // 1. Calculate Chart locally first
  const chart = calculateZiweiChart(data.year, data.month, data.day, data.hour);
  const currentYear = new Date().getFullYear();

  // If no key configured, fail fast to fallback
  if (!GEMINI_API_KEY) {
    console.warn("No API Key configured, using fallback.");
    return generateFallbackAnalysis(data, chart);
  }

  const simplifiedPalaces = chart.palaces.map(p => ({
      name: p.name,
      stem: p.heavenlyStem,
      branch: p.earthlyBranch,
      stars: p.stars.map(s => s.name).join(', ')
  }));

  const prompt = `
    Role: Zi Wei Dou Shu Expert (紫微斗数专家).
    Language: Simplified Chinese (简体中文). 
    
    Task: Interpret the provided Zi Wei Dou Shu chart. The stars have already been placed.
    
    User Info:
    - Lunar: ${data.year}年 ${data.month}月 ${data.day}日 ${data.hour}时
    - Gender: ${data.gender}
    - Bureau: ${chart.bureau}
    
    CHART STRUCTURE (Do NOT change star positions, interpret them as provided):
    ${JSON.stringify(simplifiedPalaces, null, 2)}
    
    Required Output:
    1. **Overall Luck**: Summarize the life potential based on Life Palace (命宫) and Bureau.
    2. **Palace Analysis**: Provide a short description/reading for each palace based on the stars present.
    3. **Life Trajectory (Da Xian - 1 to 100 years)**: 
       - Calculate Da Xian ages based on Bureau (${chart.bureau}).
       - Generate 10-11 decades of analysis (covering roughly age ${chart.bureau === '水二局' ? '2' : '3-6'} to 100+).
       - Provide score and key events for each decade.
    4. **Current Year (${currentYear})**: Detailed Liu Nian analysis.
    5. **Life Cautions (人生注意事项)**: Provide 3-5 critical warnings, cautions, or advice regarding health, personality flaws, or major risks based on the chart.
    
    Return pure JSON.
  `;

  try {
    const response = await generateWithRetry(async () => {
      return await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 1024 }, 
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              userType: { type: Type.STRING, description: "e.g. 紫微在子坐命 - 水二局" },
              overallLuck: { type: Type.STRING },
              palaces: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.NUMBER },
                    description: { type: Type.STRING }
                  }
                }
              },
              trajectory: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    ageRange: { type: Type.STRING, description: "e.g. 2-11" },
                    startAge: { type: Type.NUMBER },
                    score: { type: Type.NUMBER },
                    summary: { type: Type.STRING },
                    keyEvents: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              },
              liuNian: {
                type: Type.OBJECT,
                properties: {
                  year: { type: Type.NUMBER },
                  ganZhi: { type: Type.STRING },
                  theme: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  summary: { type: Type.STRING },
                  aspects: {
                    type: Type.OBJECT,
                    properties: {
                      career: { type: Type.STRING },
                      careerHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                      wealth: { type: Type.STRING },
                      love: { type: Type.STRING },
                      loveHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                      health: { type: Type.STRING }
                    }
                  }
                }
              },
              lifeCautions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "List of 3-5 life cautions or warnings."
              }
            }
          }
        }
      });
    }, 5, 3000); 

    if (response.text) {
      const parsed = JSON.parse(response.text) as Partial<ZiWeiAnalysis>;
      
      const mergedPalaces = chart.palaces.map((p, index) => {
          const aiPalace = parsed.palaces ? parsed.palaces[index] : null;
          return {
              ...p,
              description: aiPalace?.description || "暂无详解"
          };
      });

      return {
          userType: parsed.userType || `${chart.bureau} - ${mergedPalaces[chart.lifePalaceIndex].heavenlyStem}${mergedPalaces[chart.lifePalaceIndex].earthlyBranch}宫安命`,
          overallLuck: parsed.overallLuck || "命盘分析完成",
          palaces: mergedPalaces,
          trajectory: parsed.trajectory || [],
          liuNian: parsed.liuNian!,
          lifeCautions: parsed.lifeCautions || []
      };
    }
    throw new Error("Empty response from AI");

  } catch (error: any) {
    console.error("Gemini API Error, switching to fallback:", error);
    // Graceful fallback instead of crashing the app
    return generateFallbackAnalysis(data, chart);
  }
};

export const generateSpecificLiuNian = async (
    userInfo: LunarDate, 
    year: number, 
    palaces: Palace[]
): Promise<LiuNian> => {
    
    if (!GEMINI_API_KEY) {
        return {
            year,
            ganZhi: "",
            theme: "离线",
            score: 50,
            summary: "离线模式无法获取流年运势。",
            aspects: { career: "", wealth: "", love: "", health: "" }
        };
    }

    const simplifiedPalaces = palaces.map(p => ({
        name: p.name,
        branch: p.earthlyBranch,
        stars: p.stars.filter(s => s.type === 'major' || s.type === 'bad' || s.type === 'good').map(s => s.name)
    }));

    const prompt = `
      Role: Zi Wei Dou Shu Expert (紫微斗数专家).
      Language: Simplified Chinese (简体中文).
      Task: Analyze the Annual Luck (Liu Nian) for the specific year: ${year}.
      
      Context:
      - User Gender: ${userInfo.gender}
      - Birth Year: ${userInfo.year}
      - Target Year: ${year}
      - Chart Structure: ${JSON.stringify(simplifiedPalaces)}

      Instructions:
      1. Determine the Liu Nian Ming Gong (Annual Life Palace) for ${year} based on the Earthly Branch of the year.
      2. Analyze the stars in that palace and its trine (San Fang Si Zheng).
      3. **Important**: Place special emphasis on **Career (Career/Academic)** and **Love (Relationship)** analysis as requested by the user.

      Output JSON matching the LiuNian schema.
    `;

    try {
        const response = await generateWithRetry(async () => {
            return await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    thinkingConfig: { thinkingBudget: 1024 },
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            year: { type: Type.NUMBER },
                            ganZhi: { type: Type.STRING },
                            theme: { type: Type.STRING },
                            score: { type: Type.NUMBER },
                            summary: { type: Type.STRING },
                            aspects: {
                                type: Type.OBJECT,
                                properties: {
                                    career: { type: Type.STRING, description: "Detailed analysis of career/study." },
                                    careerHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    wealth: { type: Type.STRING },
                                    love: { type: Type.STRING, description: "Detailed analysis of love/relationships." },
                                    loveHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    health: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            });
        }, 5, 2000);

        if (response.text) {
            return JSON.parse(response.text) as LiuNian;
        }
        throw new Error("Empty response");
    } catch (error: any) {
        console.error("Liu Nian Generation Error (Fallback):", error);
        
        // Return dummy data for Liu Nian fallback
        return {
            year,
            ganZhi: "",
            theme: "无法获取",
            score: 50,
            summary: "由于 AI 服务暂时无法连接，无法提供详细的流年运势分析。",
            aspects: {
                career: "暂无数据",
                wealth: "暂无数据",
                love: "暂无数据",
                health: "暂无数据"
            }
        };
    }
};
