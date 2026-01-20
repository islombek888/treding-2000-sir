export class MarketDataService {
    history = new Map();
    ensureSymbol(symbol) {
        if (!this.history.has(symbol)) {
            const symbolMap = new Map();
            symbolMap.set('1m', []);
            symbolMap.set('5m', []);
            symbolMap.set('15m', []);
            symbolMap.set('30m', []);
            symbolMap.set('1h', []);
            this.history.set(symbol, symbolMap);
        }
    }
    addCandle(symbol, tf, candle) {
        this.ensureSymbol(symbol);
        const tfMap = this.history.get(symbol);
        const candles = tfMap.get(tf) || [];
        candles.push(candle);
        if (candles.length > 500)
            candles.shift();
        tfMap.set(tf, candles);
    }
    getCandles(symbol, tf) {
        this.ensureSymbol(symbol);
        return this.history.get(symbol).get(tf) || [];
    }
    getLatestPrice(symbol) {
        this.ensureSymbol(symbol);
        const m1 = this.history.get(symbol).get('1m');
        if (m1 && m1.length > 0) {
            return m1[m1.length - 1].close;
        }
        return null;
    }
}
//# sourceMappingURL=marketDataService.js.map