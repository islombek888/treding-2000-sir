
export interface ProbabilityResult {
    totalScore: number;
    confluenceList: string[];
    isSafe: boolean;
    strategy: string;
}

export class ProbabilityEngine {
    static calculate(analysis: {
        ta: string;
        struct: any;
        vol: { expanding: boolean; ATR: number };
        divergence: string;
        news: { status: string; events: string[] };
        channel: 'ASCENDING' | 'DESCENDING' | 'NONE';
    }): ProbabilityResult {
        let score = 0;
        const confluenceList: string[] = [];
        let strategy = 'Universal Institutional Model';

        // 1. Technical Confluence (35%) - Multi-tf EMA
        if (analysis.ta === 'BULLISH' || analysis.ta === 'BEARISH') {
            score += 35;
            confluenceList.push('Institutional Trend (EMA Multi-TF)');
            strategy = 'Asset Trend Continuation Pro';
        } else if (analysis.ta === 'NEUTRAL') {
            // Give partial credit for neutral/mixed trend if other factors exist
            score += 15;
            confluenceList.push('Secondary Trend Support');
        }

        // 2. Structure Confluence (40%) - BOS/HH/LL
        if (analysis.struct.bos) {
            score += 25;
            confluenceList.push('Break of Structure (BOS)');
            strategy = 'Institutional BOS + Liquidity';
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

        // 4. Divergence (15%)
        if (analysis.divergence !== 'NONE') {
            score += 15;
            confluenceList.push(`RSI ${analysis.divergence} Divergence`);
        }

        // 5. Channel (15%)
        if (analysis.channel !== 'NONE') {
            score += 15;
            confluenceList.push(`Channel Alignment (${analysis.channel})`);
        }

        // 6. News Filter (Mandatory)
        let isSafe = true;
        if (analysis.news.status === 'BLOCK') {
            score = 0;
            isSafe = false;
        } else if (analysis.news.status === 'RISKY') {
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
