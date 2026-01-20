import { MarketTrend, type MarketState } from './marketAnalyzer.js';

export enum RiskLevel {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH'
}

export interface RiskAssessment {
    score: number;
    riskLevel: RiskLevel;
}

export class RiskEvaluator {
    /**
     * Evaluates the risk and probability of a signal
     */
    static evaluate(state: MarketState, rsiDivergence: string): RiskAssessment {
        let score = 0;

        // Trend alignment (+30%)
        if (state.trend !== MarketTrend.RANGING) {
            score += 30;
        }

        // Divergence alignment (+20%)
        if (rsiDivergence !== 'NONE') {
            score += 20;
        }

        // Volatility alignment (+20%)
        if (state.isVolatilityExpanding) {
            score += 20;
        }

        // Structure alignment (+30%)
        if (state.hasBOS || state.hasLiquiditySweep) {
            score += 30;
        }

        // Determine Risk Level
        let riskLevel = RiskLevel.HIGH;
        if (score >= 80) {
            riskLevel = RiskLevel.LOW;
        } else if (score >= 60) {
            riskLevel = RiskLevel.MEDIUM;
        }

        return {
            score,
            riskLevel
        };
    }
}
