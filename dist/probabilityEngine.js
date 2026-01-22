export class ProbabilityEngine {
    static calculate(analysis) {
        let score = 0;
        const confluenceList = [];
        let strategy = 'Universal Institutional Model';
        // 1. Technical Confluence (25%) - Multi-tf EMA
        if (analysis.ta === 'BULLISH' || analysis.ta === 'BEARISH') {
            score += 25;
            confluenceList.push('Institutional Trend (EMA Multi-TF)');
            strategy = 'Asset Trend Continuation Pro';
        }
        else if (analysis.ta === 'NEUTRAL') {
            // Give partial credit for neutral/mixed trend if other factors exist
            score += 10;
            confluenceList.push('Secondary Trend Support');
        }
        // 2. Macro Trend Alignment (20%) - NEW
        if (analysis.macro.trend !== 'NEUTRAL') {
            if (analysis.ta === analysis.macro.trend) {
                score += 20;
                confluenceList.push(`Aligned with Macro Trend (${analysis.macro.trend})`);
            }
            else if (analysis.ta !== 'NEUTRAL' && analysis.ta !== analysis.macro.trend) {
                // Severe penalty for trading against macro trend
                score -= 30;
                confluenceList.push(`⚠️ AGAINST MACRO TREND (${analysis.macro.trend})`);
            }
        }
        // 3. Structure Confluence (25%) - BOS/HH/LL
        if (analysis.struct.bos) {
            score += 25;
            confluenceList.push('Break of Structure (BOS)');
            strategy = 'Institutional BOS + Liquidity';
        }
        if (analysis.struct.type !== 'NONE') {
            score += 10;
            confluenceList.push(`Market Structure (${analysis.struct.type})`);
        }
        // 4. Volatility Confluence (15%) - expansion
        if (analysis.vol.expanding) {
            score += 15;
            confluenceList.push('Volatility Expansion (ATR)');
        }
        // 5. Divergence (15%)
        if (analysis.divergence !== 'NONE') {
            score += 15;
            confluenceList.push(`RSI ${analysis.divergence} Divergence`);
        }
        // 6. Channel (10%)
        if (analysis.channel !== 'NONE') {
            score += 10;
            confluenceList.push(`Channel Alignment (${analysis.channel})`);
        }
        // 6. News Filter (Mandatory)
        let isSafe = true;
        if (analysis.news.status === 'BLOCK') {
            score = 0;
            isSafe = false;
        }
        else if (analysis.news.status === 'RISKY') {
            score -= 25;
            isSafe = true;
        }
        return {
            totalScore: Math.min(100, Math.max(0, score)),
            confluenceList,
            isSafe,
            strategy
        };
    }
}
//# sourceMappingURL=probabilityEngine.js.map