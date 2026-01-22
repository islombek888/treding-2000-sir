import { type Candle } from './marketDataService.js';
export declare class TechnicalAnalyzer {
    static calculateEMA(data: number[], period: number): number[];
    static calculateSlope(ema: number[], period?: number): number;
    static detectImpulseMomentum(candles: Candle[], ema20: number[]): 'STRONG_IMPULSE' | 'WEAK' | 'NONE';
    static calculateRSI(data: number[], period?: number): number[];
    static detectDivergence(prices: number[], rsi: number[], lookback?: number): 'BULLISH' | 'BEARISH' | 'NONE';
    static detectChannel(candles: Candle[]): 'ASCENDING' | 'DESCENDING' | 'NONE';
    static detectStructure(candles: Candle[]): {
        type: 'BOS' | 'SWEEP' | 'NONE';
        direction: 'BULLISH' | 'BEARISH' | 'NONE';
    };
    static detectMarketPhase(candles: Candle[]): 'EXPANSION' | 'COMPRESSION' | 'NONE';
    static calculateATR(closes: number[], period?: number): number[];
    static analyzeTrendConfluence(candlesMap: Map<string, Candle[]>): 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    static analyzeMacroStructure(candlesMap: Map<string, Candle[]>): {
        trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
        target: number;
        duration: string;
    };
}
//# sourceMappingURL=technicalAnalyzer.d.ts.map