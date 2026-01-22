import { type Candle, type Timeframe } from './marketDataService.js';

/**
 * Institutional Data Service with Fallback Support
 * Designed to fetch and synchronize XAUUSD data from multiple providers
 * with geographic restriction handling and simulation fallback.
 */
export class TradingViewDataService {
    private useSimulation = false;
    private simulationData: Map<string, Map<Timeframe, Candle[]>> = new Map();

    constructor() {
        this.initializeSimulationData();
    }

    /**
     * Fetches the latest candles with multiple provider fallbacks
     */
    public async fetchCandles(symbol: string, tf: Timeframe, limit: number = 200): Promise<Candle[]> {
        // If we've already determined to use simulation, use simulated data
        if (this.useSimulation) {
            return this.getSimulatedCandles(symbol, tf, limit);
        }

        // Try primary provider (Binance)
        const binanceData = await this.fetchFromBinance(symbol, tf, limit);
        if (binanceData.length > 0) {
            return binanceData;
        }

        // Try alternative providers
        const yahooData = await this.fetchFromYahooFinance(symbol, tf, limit);
        if (yahooData.length > 0) {
            return yahooData;
        }

        // If all real providers fail, fall back to simulation
        console.warn(`[DataService] ⚠️ All providers failed for ${symbol}, switching to simulation mode`);
        this.useSimulation = true;
        return this.getSimulatedCandles(symbol, tf, limit);
    }

    private async fetchFromBinance(symbol: string, tf: Timeframe, limit: number): Promise<Candle[]> {
        const resolutionMap: Record<string, string> = {
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
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data: any = await response.json();

            if (!Array.isArray(data)) {
                console.error(`[DataService] ❌ Binance Error for ${symbol}:`, data);
                return [];
            }

            return this.parseProviderData(data);
        } catch (error: any) {
            if (error.message.includes('restricted location') || error.message.includes('403')) {
                console.warn(`[DataService] 🌍 Geographic restriction detected for ${symbol}`);
            } else {
                console.error(`[DataService] ❌ Binance Fetch Error for ${symbol}:`, error.message);
            }
            return [];
        }
    }

    private async fetchFromYahooFinance(symbol: string, tf: Timeframe, limit: number): Promise<Candle[]> {
        try {
            const yahooSymbol = symbol === 'XAUUSD' ? 'GC=F' : 'EUR=X';
            const intervalMap: Record<string, string> = {
                '1m': '1m',
                '5m': '5m',
                '15m': '15m',
                '30m': '30m',
                '1h': '1h'
            };
            
            const interval = intervalMap[tf] || '1m';
            
            // Yahoo Finance API (unofficial)
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${interval}&range=${Math.ceil(limit / 60)}d`;
            
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json() as any;
            
            if (!data.chart?.result?.[0]?.timestamp) {
                console.error(`[DataService] ❌ Yahoo Finance invalid data for ${symbol}`);
                return [];
            }
            
            const result = data.chart.result[0];
            const timestamps = result.timestamp;
            const ohlc = result.indicators.quote[0];
            
            const candles: Candle[] = [];
            for (let i = 0; i < timestamps.length && i < limit; i++) {
                if (ohlc.open[i] && ohlc.high[i] && ohlc.low[i] && ohlc.close[i]) {
                    candles.push({
                        timestamp: timestamps[i] * 1000,
                        open: ohlc.open[i],
                        high: ohlc.high[i],
                        low: ohlc.low[i],
                        close: ohlc.close[i],
                        volume: ohlc.volume[i] || 0
                    });
                }
            }
            
            return candles;
        } catch (error: any) {
            console.error(`[DataService] ❌ Yahoo Finance Error for ${symbol}:`, error.message);
            return [];
        }
    }

    private initializeSimulationData(): void {
        const symbols = ['XAUUSD', 'EURUSD'];
        const timeframes: Timeframe[] = ['1m', '5m', '15m', '1h'];
        
        symbols.forEach(symbol => {
            const symbolMap = new Map<Timeframe, Candle[]>();
            
            timeframes.forEach(tf => {
                const candles = this.generateSimulatedData(symbol, tf, 300);
                symbolMap.set(tf, candles);
            });
            
            this.simulationData.set(symbol, symbolMap);
        });
        
        console.log('[DataService] 📊 Simulation data initialized for fallback');
    }

    private generateSimulatedData(symbol: string, tf: Timeframe, count: number): Candle[] {
        const candles: Candle[] = [];
        const basePrice = symbol === 'XAUUSD' ? 2050 : 1.08;
        const volatility = symbol === 'XAUUSD' ? 2.0 : 0.002;
        
        let currentPrice = basePrice;
        const now = Date.now();
        const intervalMs = this.getTimeframeMs(tf);
        
        // Create realistic market structure
        let trend = 0;
        let trendDuration = 0;
        
        for (let i = 0; i < count; i++) {
            // Change trend periodically
            if (trendDuration <= 0) {
                trend = (Math.random() - 0.5) * volatility * 0.5;
                trendDuration = Math.floor(Math.random() * 50) + 20;
            }
            
            // Generate price movement
            const noise = (Math.random() - 0.5) * volatility * 0.3;
            const move = trend + noise;
            
            const open = currentPrice;
            currentPrice += move;
            
            const high = Math.max(open, currentPrice) + Math.random() * volatility * 0.2;
            const low = Math.min(open, currentPrice) - Math.random() * volatility * 0.2;
            const close = currentPrice;
            const volume = Math.floor(Math.random() * 5000) + 1000;
            
            candles.push({
                timestamp: now - (count - i) * intervalMs,
                open,
                high,
                low,
                close,
                volume
            });
            
            trendDuration--;
        }
        
        return candles;
    }

    private getTimeframeMs(tf: Timeframe): number {
        const map: Record<Timeframe, number> = {
            '1m': 60 * 1000,
            '5m': 5 * 60 * 1000,
            '15m': 15 * 60 * 1000,
            '30m': 30 * 60 * 1000,
            '1h': 60 * 60 * 1000
        };
        return map[tf];
    }

    private getSimulatedCandles(symbol: string, tf: Timeframe, limit: number): Candle[] {
        const symbolData = this.simulationData.get(symbol);
        if (!symbolData) {
            console.error(`[DataService] ❌ No simulation data for ${symbol}`);
            return [];
        }
        
        const tfData = symbolData.get(tf);
        if (!tfData) {
            console.error(`[DataService] ❌ No simulation data for ${symbol} ${tf}`);
            return [];
        }
        
        // Return the latest candles with some variation
        const baseCandles = tfData.slice(-limit);
        
        // Add small random variations to make it more realistic
        return baseCandles.map(candle => ({
            ...candle,
            high: candle.high + (Math.random() - 0.5) * 0.1,
            low: candle.low + (Math.random() - 0.5) * 0.1,
            close: candle.close + (Math.random() - 0.5) * 0.05,
            volume: candle.volume + Math.floor((Math.random() - 0.5) * 500)
        }));
    }

    private parseProviderData(data: any[]): Candle[] {
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
