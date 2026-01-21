import { type Candle } from './marketDataService.js';
export declare class TechnicalAnalyzer {
    static calculateEMA(data: number[], period: number): number[];
    static calculateRSI(data: number[], period?: number): number[];
    static detectDivergence(prices: number[], rsi: number[], lookback?: number): 'BULLISH' | 'BEARISH' | 'NONE';
    static detectChannel(candles: Candle[]): 'ASCENDING' | 'DESCENDING' | 'NONE';
    static detectStructure(candles: Candle[]): {
        type: 'BOS' | 'SWEEP' | 'NONE';
        direction: 'BULLISH' | 'BEARISH' | 'NONE';
    };
    static analyzeTrendConfluence(candlesMap: Map<string, Candle[]>): 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}
//# sourceMappingURL=technicalAnalyzer.d.ts.map