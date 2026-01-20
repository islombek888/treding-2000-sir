/**
 * IndicatorService
 * Handles core technical indicator calculations for XAUUSD.
 */
export class IndicatorService {
    /**
     * Calculates Exponential Moving Average (EMA)
     */
    static calculateEMA(data, period) {
        const ema = [];
        const k = 2 / (period + 1);
        // Initial SMA as the first EMA value
        let sma = data.slice(0, period).reduce((acc, val) => acc + val, 0) / period;
        ema[period - 1] = sma;
        for (let i = period; i < data.length; i++) {
            const currentData = data[i];
            const prevEma = ema[i - 1];
            const nextEma = (currentData - prevEma) * k + prevEma;
            ema[i] = nextEma;
        }
        return ema;
    }
    /**
     * Calculates Relative Strength Index (RSI)
     */
    static calculateRSI(data, period = 14) {
        const rsi = [];
        let gains = [];
        let losses = [];
        for (let i = 1; i < data.length; i++) {
            const diff = data[i] - data[i - 1];
            gains.push(diff > 0 ? diff : 0);
            losses.push(diff < 0 ? Math.abs(diff) : 0);
        }
        let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
        let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
        rsi[period] = 100 - (100 / (1 + avgGain / (avgLoss || 0.0001)));
        for (let i = period + 1; i < data.length; i++) {
            avgGain = (avgGain * (period - 1) + (gains[i - 1] || 0)) / period;
            avgLoss = (avgLoss * (period - 1) + (losses[i - 1] || 0)) / period;
            rsi[i] = 100 - (100 / (1 + avgGain / (avgLoss || 0.0001)));
        }
        return rsi;
    }
    /**
     * Calculates Average True Range (ATR)
     */
    static calculateATR(candles, period = 14) {
        const tr = [];
        for (let i = 1; i < candles.length; i++) {
            const h = candles[i].high;
            const l = candles[i].low;
            const pc = candles[i - 1].close;
            tr.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
        }
        const atr = [];
        let avgTr = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
        atr[period] = avgTr;
        for (let i = period + 1; i < tr.length + 1; i++) {
            avgTr = (avgTr * (period - 1) + (tr[i - 1] || 0)) / period;
            atr[i] = avgTr;
        }
        return atr;
    }
    /**
     * Detects RSI Divergence
     */
    static detectDivergence(prices, rsi, lookback = 10) {
        if (prices.length < lookback || rsi.length < lookback)
            return 'NONE';
        const lastPrice = prices[prices.length - 1];
        const prevPrice = prices[prices.length - lookback];
        const lastRsi = rsi[rsi.length - 1];
        const prevRsi = rsi[rsi.length - lookback];
        // Bullish Divergence: Price lower low, RSI higher low
        if (lastPrice < prevPrice && lastRsi > prevRsi && lastRsi < 40) {
            return 'BULLISH';
        }
        // Bearish Divergence: Price higher high, RSI lower high
        if (lastPrice > prevPrice && lastRsi < prevRsi && lastRsi > 60) {
            return 'BEARISH';
        }
        return 'NONE';
    }
}
//# sourceMappingURL=indicatorService.js.map