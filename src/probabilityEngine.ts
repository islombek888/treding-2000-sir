
export interface ProbabilityResult {
    totalScore: number;
    confluenceList: string[];
    isSafe: boolean;
    strategy: string;
    macro?: {
        trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
        target: number;
        duration: string;
    };
}

export class ProbabilityEngine {
    static calculate(analysis: {
        ta: string;
        struct: any;
        vol: { expanding: boolean; ATR: number };
        divergence: string;
        news: { status: string; events: string[] };
        channel: 'ASCENDING' | 'DESCENDING' | 'NONE';
        macro: { trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; target: number; duration: string };
        slope: number;
        impulse: 'STRONG_IMPULSE' | 'WEAK' | 'NONE';
    }): ProbabilityResult {
        let score = 0;
        const confluenceList: string[] = [];
        let strategy = 'Universal Institutional Model';

        // 1. Technical Confluence (30%) - Multi-tf EMA
        if (analysis.ta === 'BULLISH' || analysis.ta === 'BEARISH') {
            score += 30;
            confluenceList.push('Institutional Trend (EMA Multi-TF)');
            strategy = 'Asset Trend Continuation Pro';
        } else if (analysis.ta === 'NEUTRAL') {
            // STRICT MODE: No points for neutral
            score -= 10;
        }

        // 2. Macro Trend Alignment (25%) - CRITICAL
        if (analysis.macro.trend !== 'NEUTRAL') {
            if (analysis.ta === analysis.macro.trend) {
                score += 25;
                confluenceList.push(`Aligned with Macro Trend (${analysis.macro.trend})`);
            } else if (analysis.ta !== 'NEUTRAL' && analysis.ta !== analysis.macro.trend) {
                // FATAL PENALTY: Trading against macro trend is forbidden
                score -= 100;
                confluenceList.push(`⛔ BLOCKED: Against Macro Trend (${analysis.macro.trend})`);
            }
        }

        // 3. Momentum & Impulse (15%) - NEW
        if (analysis.impulse === 'STRONG_IMPULSE') {
            score += 15;
            confluenceList.push('Strong Momentum Impulse');
        } else if (analysis.impulse === 'WEAK') {
            score += 5;
        }

        // 4. Structure Confluence (20%) - BOS/HH/LL
        if (analysis.struct.bos) {
            score += 20;
            confluenceList.push('Break of Structure (BOS)');
            strategy = 'Institutional BOS + Liquidity';
        }

        // 5. Volatility (10%)
        if (analysis.vol.expanding) {
            score += 10;
            confluenceList.push('Volatility Expansion (ATR)');
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
