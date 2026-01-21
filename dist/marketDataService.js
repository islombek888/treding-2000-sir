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
        // Automatic Aggregation from 1m to higher TFs
        if (tf === '1m') {
            this.aggregate(symbol, '5m', 5);
            this.aggregate(symbol, '15m', 15);
            this.aggregate(symbol, '30m', 30);
            this.aggregate(symbol, '1h', 60);
        }
    }
    aggregate(symbol, targetTf, count) {
        const tfMap = this.history.get(symbol);
        const m1 = tfMap.get('1m') || [];
        if (m1.length < count || m1.length % count !== 0)
            return;
        const slice = m1.slice(-count);
        const aggregated = {
            timestamp: slice[0].timestamp,
            open: slice[0].open,
            high: Math.max(...slice.map(c => c.high)),
            low: Math.min(...slice.map(c => c.low)),
            close: slice[slice.length - 1].close,
            volume: slice.reduce((a, b) => a + b.volume, 0)
        };
        const existing = tfMap.get(targetTf) || [];
        // Only add if not already present for this timestamp (to avoid duplicates if called multiple times)
        if (existing.length === 0 || existing[existing.length - 1].timestamp !== aggregated.timestamp) {
            existing.push(aggregated);
            if (existing.length > 200)
                existing.shift();
            tfMap.set(targetTf, existing);
        }
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