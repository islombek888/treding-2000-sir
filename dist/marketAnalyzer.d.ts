import { type Candle } from './indicatorService.js';
export declare enum MarketTrend {
    BULLISH = "BULLISH",
    BEARISH = "BEARISH",
    RANGING = "RANGING"
}
export interface MarketState {
    trend: MarketTrend;
    isVolatilityExpanding: boolean;
    hasBOS: boolean;
    hasLiquiditySweep: boolean;
    atr: number;
}
export declare class MarketAnalyzer {
    /**
     * Analyzes current market state based on indicators and structure
     */
    static analyze(candles: Candle[]): MarketState;
    private static detectBOS;
    private static detectLiquiditySweep;
}
//# sourceMappingURL=marketAnalyzer.d.ts.map