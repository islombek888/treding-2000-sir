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
export declare class ProbabilityEngine {
    static calculate(analysis: {
        ta: string;
        struct: any;
        vol: {
            expanding: boolean;
            ATR: number;
        };
        divergence: string;
        news: {
            status: string;
            events: string[];
        };
        channel: 'ASCENDING' | 'DESCENDING' | 'NONE';
        macro: {
            trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
            target: number;
            duration: string;
        };
    }): ProbabilityResult;
}
//# sourceMappingURL=probabilityEngine.d.ts.map