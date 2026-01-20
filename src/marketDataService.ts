export interface Candle {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h';

export class MarketDataService {
    private history: Map<string, Map<Timeframe, Candle[]>> = new Map();

    private ensureSymbol(symbol: string) {
        if (!this.history.has(symbol)) {
            const symbolMap = new Map<Timeframe, Candle[]>();
            symbolMap.set('1m', []);
            symbolMap.set('5m', []);
            symbolMap.set('15m', []);
            symbolMap.set('30m', []);
            symbolMap.set('1h', []);
            this.history.set(symbol, symbolMap);
        }
    }

    public addCandle(symbol: string, tf: Timeframe, candle: Candle) {
        this.ensureSymbol(symbol);
        const tfMap = this.history.get(symbol)!;
        const candles = tfMap.get(tf) || [];
        candles.push(candle);
        if (candles.length > 500) candles.shift();
        tfMap.set(tf, candles);
    }

    public getCandles(symbol: string, tf: Timeframe): Candle[] {
        this.ensureSymbol(symbol);
        return this.history.get(symbol)!.get(tf) || [];
    }

    public getLatestPrice(symbol: string): number | null {
        this.ensureSymbol(symbol);
        const m1 = this.history.get(symbol)!.get('1m');
        if (m1 && m1.length > 0) {
            return m1[m1.length - 1]!.close;
        }
        return null;
    }
}
