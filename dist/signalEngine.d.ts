import { type Candle } from './indicatorService.js';
export declare class SignalEngine {
    /**
     * Processes new market data and determines if a signal should be triggered
     */
    static process(candles: Candle[]): void;
    private static generateReason;
}
//# sourceMappingURL=signalEngine.d.ts.map