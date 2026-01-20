import { type MarketDataService } from './marketDataService.js';
import { type ProbabilityResult } from './probabilityEngine.js';
export declare class DecisionEngine {
    /**
     * The PRO MAX iterative decision loop.
     * Analyzes the market 15 times to ensure consistency.
     */
    static decide(dataService: MarketDataService, symbol: string): Promise<ProbabilityResult | null>;
}
//# sourceMappingURL=decisionEngine.d.ts.map