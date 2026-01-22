import { type Candle, type Timeframe } from './marketDataService.js';
/**
 * Institutional Data Service
 * Designed to fetch and synchronize XAUUSD data from real-world providers
 * that match TradingView's OHLCV feeds.
 */
export declare class TradingViewDataService {
    /**
     * Fetches the latest candles for a specific timeframe using Binance.
     */
    fetchCandles(symbol: string, tf: Timeframe, limit?: number): Promise<Candle[]>;
    private parseProviderData;
}
//# sourceMappingURL=tradingViewDataService.d.ts.map