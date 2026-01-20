import { type Candle } from './marketDataService.js';
export declare class TechnicalAnalyzer {
    static calculateEMA(data: number[], period: number): number[];
    static calculateRSI(data: number[], period?: number): number[];
    static detectDivergence(prices: number[], rsi: number[], lookback?: number): 'BULLISH' | 'BEARISH' | 'NONE';
    static analyzeTrendConfluence(candles: Candle[]): 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}
//# sourceMappingURL=technicalAnalyzer.d.ts.map