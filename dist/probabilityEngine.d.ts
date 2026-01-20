export interface ProbabilityResult {
    totalScore: number;
    confluenceList: string[];
    isSafe: boolean;
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
    }): ProbabilityResult;
}
//# sourceMappingURL=probabilityEngine.d.ts.map