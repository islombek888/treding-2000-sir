import { type MarketState } from './marketAnalyzer.js';
export declare enum RiskLevel {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH"
}
export interface RiskAssessment {
    score: number;
    riskLevel: RiskLevel;
}
export declare class RiskEvaluator {
    /**
     * Evaluates the risk and probability of a signal
     */
    static evaluate(state: MarketState, rsiDivergence: string): RiskAssessment;
}
//# sourceMappingURL=riskEvaluator.d.ts.map