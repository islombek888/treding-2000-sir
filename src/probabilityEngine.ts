import { type TechnicalAnalyzer } from './technicalAnalyzer.js';
import { type StructureAnalyzer } from './structureAnalyzer.js';
import { type VolatilityEngine } from './volatilityEngine.js';
import { type NewsAnalyzer } from './newsAnalyzer.js';

export interface ProbabilityResult {
    totalScore: number;
    confluenceList: string[];
    isSafe: boolean;
}

export class ProbabilityEngine {
    static calculate(analysis: {
        ta: string;
        struct: any;
        vol: { expanding: boolean; ATR: number };
        divergence: string;
        news: { status: string; events: string[] };
    }): ProbabilityResult {
        let score = 0;
        const confluenceList: string[] = [];

        // 1. Technical Confluence (30%)
        if (analysis.ta === 'BULLISH' || analysis.ta === 'BEARISH') {
            score += 30;
            confluenceList.push('Trend mosligi (EMA 20/50/200)');
        }

        // 2. Structure Confluence (25%)
        if (analysis.struct.bos) {
            score += 15;
            confluenceList.push('Struktura buzilishi (BOS)');
        }
        if (analysis.struct.sweep) {
            score += 10;
            confluenceList.push('Likvidlik yig\'ilishi (Sweep)');
        }

        // 3. Volatility Confluence (20%)
        if (analysis.vol.expanding) {
            score += 20;
            confluenceList.push('Volatillik kengayishi (ATR)');
        }

        // 4. Divergence Confluence (15%)
        if (analysis.divergence !== 'NONE') {
            score += 15;
            confluenceList.push(`RSI ${analysis.divergence === 'BULLISH' ? 'O\'suvchi' : 'Pasayuvchi'} Divergensiya`);
        }

        // 5. News Logic (Penalty/Block)
        let isSafe = true;
        if (analysis.news.status === 'BLOCK') {
            score = 0;
            isSafe = false;
        } else if (analysis.news.status === 'RISKY') {
            score -= 20;
            isSafe = true;
        }

        return {
            totalScore: Math.max(0, score),
            confluenceList,
            isSafe
        };
    }
}
