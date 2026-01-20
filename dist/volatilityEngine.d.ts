import { type Candle } from './marketDataService.js';
export declare class VolatilityEngine {
    static calculateATR(candles: Candle[], period?: number): number[];
    static isExpanding(atr: number[]): boolean;
    static isCompressing(atr: number[]): boolean;
}
//# sourceMappingURL=volatilityEngine.d.ts.map