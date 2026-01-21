import {} from './technicalAnalyzer.js';
import {} from './structureAnalyzer.js';
import {} from './volatilityEngine.js';
import {} from './newsAnalyzer.js';
export class ProbabilityEngine {
    static calculate(analysis) {
        let score = 0;
        const confluenceList = [];
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
        }
        else if (analysis.news.status === 'RISKY') {
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
//# sourceMappingURL=probabilityEngine.js.map