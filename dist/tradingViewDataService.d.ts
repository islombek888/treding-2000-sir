import { type Candle, type Timeframe } from './marketDataService.js';
/**
 * Institutional Data Service
 * Designed to fetch and synchronize XAUUSD data from real-world providers
 * that match TradingView's OHLCV feeds.
 */
export declare class TradingViewDataService {
    private apiKey;
    constructor();
    /**
     * Fetches the latest candles for a specific timeframe.
     * In a production environment, this would call a provider like TwelveData,
     * OANDA, or a Direct WebSocket feed.
     */
    fetchCandles(symbol: string, tf: Timeframe, limit?: number): Promise<Candle[]>;
    /**
     * Parse provider-specific data into our internal Candle format.
     */
    private parseProviderData;
}
//# sourceMappingURL=tradingViewDataService.d.ts.map