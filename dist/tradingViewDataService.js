import {} from './marketDataService.js';
/**
 * Institutional Data Service
 * Designed to fetch and synchronize XAUUSD data from real-world providers
 * that match TradingView's OHLCV feeds.
 */
export class TradingViewDataService {
    /**
     * Fetches the latest candles for a specific timeframe using Binance.
     */
    async fetchCandles(symbol, tf, limit = 200) {
        const resolutionMap = {
            '1m': '1m',
            '5m': '5m',
            '15m': '15m',
            '30m': '30m',
            '1h': '1h'
        };
        const resolution = resolutionMap[tf] || '1m';
        const providerSymbol = symbol === 'XAUUSD' ? 'PAXGUSDT' : 'EURUSDT';
        try {
            const url = `https://api.binance.com/api/v3/klines?symbol=${providerSymbol}&interval=${resolution}&limit=${limit}`;
            const response = await fetch(url);
            const data = await response.json();
            if (!Array.isArray(data)) {
                console.error(`[DataService] ❌ Binance Error for ${symbol}:`, data);
                return [];
            }
            return this.parseProviderData(data);
        }
        catch (error) {
            console.error(`[DataService] ❌ Binance Fetch Error for ${symbol}:`, error);
            return [];
        }
    }
    parseProviderData(data) {
        return data.map(k => ({
            timestamp: Number(k[0]),
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5])
        }));
    }
}
//# sourceMappingURL=tradingViewDataService.js.map