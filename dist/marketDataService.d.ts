export interface Candle {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h';
export declare class MarketDataService {
    private history;
    private ensureSymbol;
    addCandle(symbol: string, tf: Timeframe, candle: Candle): void;
    private aggregate;
    getCandles(symbol: string, tf: Timeframe): Candle[];
    getLatestPrice(symbol: string): number | null;
}
//# sourceMappingURL=marketDataService.d.ts.map