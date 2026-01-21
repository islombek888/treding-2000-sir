export class ProbabilityEngine {
    static calculate(analysis) {
        let score = 0;
        const confluenceList = [];
        let strategy = 'Universal Institutional Model';
        // 1. Technical Confluence (35%) - Multi-tf EMA
        if (analysis.ta === 'BULLISH' || analysis.ta === 'BEARISH') {
            score += 35;
            confluenceList.push('Institutional Trend (EMA Multi-TF)');
            strategy = 'Gold Trend Continuation Pro';
        }
        // 2. Structure Confluence (30%) - BOS/HH/LL
        if (analysis.struct.bos) {
            score += 20;
            confluenceList.push('Break of Structure (BOS)');
            strategy = 'XAUUSD BOS + Liquidity Strategy';
        }
        if (analysis.struct.type !== 'NONE') {
            score += 10;
            confluenceList.push(`Market Structure (${analysis.struct.type})`);
        }
        // 3. Volatility Confluence (15%) - expansion
        if (analysis.vol.expanding) {
            score += 15;
            confluenceList.push('Volatility Expansion (ATR)');
        }
        // 4. Divergence (10%)
        if (analysis.divergence !== 'NONE') {
            score += 10;
            confluenceList.push(`RSI ${analysis.divergence} Divergence`);
        }
        // 5. Channel (10%)
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