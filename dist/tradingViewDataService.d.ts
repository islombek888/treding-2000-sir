import { type Candle, type Timeframe } from './marketDataService.js';
/**
 * Institutional Data Service with Fallback Support
 * Designed to fetch and synchronize XAUUSD data from multiple providers
 * with geographic restriction handling and simulation fallback.
 */
export declare class TradingViewDataService {
    private useSimulation;
    private useBinance;
    private simulationData;
    constructor();
    /**
     * Fetches the latest candles with multiple provider fallbacks
     */
    fetchCandles(symbol: string, tf: Timeframe, limit?: number): Promise<Candle[]>;
    private fetchFromBinance;
    private fetchFromYahooFinance;
    private initializeSimulationData;
    private generateSimulatedData;
    private getTimeframeMs;
    private getSimulatedCandles;
    private parseProviderData;
}
//# sourceMappingURL=tradingViewDataService.d.ts.map