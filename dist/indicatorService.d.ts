/**
 * IndicatorService
 * Handles core technical indicator calculations for XAUUSD.
 */
export interface Candle {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}
export declare class IndicatorService {
    /**
     * Calculates Exponential Moving Average (EMA)
     */
    static calculateEMA(data: number[], period: number): number[];
    /**
     * Calculates Relative Strength Index (RSI)
     */
    static calculateRSI(data: number[], period?: number): number[];
    /**
     * Calculates Average True Range (ATR)
     */
    static calculateATR(candles: Candle[], period?: number): number[];
    /**
     * Detects RSI Divergence
     */
    static detectDivergence(prices: number[], rsi: number[], lookback?: number): 'BULLISH' | 'BEARISH' | 'NONE';
}
//# sourceMappingURL=indicatorService.d.ts.map