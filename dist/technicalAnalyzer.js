import {} from './marketDataService.js';
export class TechnicalAnalyzer {
    static calculateEMA(data, period) {
        if (data.length < period)
            return [];
        const ema = [];
        const k = 2 / (period + 1);
        let sma = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
        ema[period - 1] = sma;
        for (let i = period; i < data.length; i++) {
            ema.push((data[i] - ema[ema.length - 1]) * k + ema[ema.length - 1]);
        }
        return ema;
    }
    static calculateRSI(data, period = 14) {
        if (data.length <= period)
            return [];
        const rsi = [];
        const gains = [];
        const losses = [];
        for (let i = 1; i < data.length; i++) {
            const diff = data[i] - data[i - 1];
            gains.push(diff > 0 ? diff : 0);
            losses.push(diff < 0 ? Math.abs(diff) : 0);
        }
        let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
        let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
        rsi[period] = 100 - (100 / (1 + (avgGain / (avgLoss || 0.00001))));
        for (let i = period + 1; i < data.length; i++) {
            avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
            avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
            rsi[i] = 100 - (100 / (1 + (avgGain / (avgLoss || 0.00001))));
        }
        return rsi;
    }
    static detectDivergence(prices, rsi, lookback = 20) {
        if (prices.length < lookback || rsi.length < lookback)
            return 'NONE';
        const lastPrice = prices[prices.length - 1];
        const prevPrice = prices[prices.length - lookback];
        const lastRsi = rsi[rsi.length - 1];
        const prevRsi = rsi[rsi.length - lookback];
        // Bullish Divergence: Price Lower Low, RSI Higher Low
        if (lastPrice < prevPrice && lastRsi > prevRsi && lastRsi < 40)
            return 'BULLISH';
        // Bearish Divergence: Price Higher High, RSI Lower High
        if (lastPrice > prevPrice && lastRsi < prevRsi && lastRsi > 60)
            return 'BEARISH';
        return 'NONE';
    }
    static analyzeTrendConfluence(candles) {
        const closes = candles.map(c => c.close);
        const ema20 = this.calculateEMA(closes, 20);
        const ema50 = this.calculateEMA(closes, 50);
        const ema200 = this.calculateEMA(closes, 200);
        if (ema20.length === 0 || ema50.length === 0 || ema200.length === 0)
            return 'NEUTRAL';
        const e20 = ema20[ema20.length - 1];
        const e50 = ema50[ema50.length - 1];
        const e200 = ema200[ema200.length - 1];
        const current = closes[closes.length - 1];
        // 1. Classic EMA Trend
        if (current > e20 && e20 > e50 && e50 > e200)
            return 'BULLISH';
        if (current < e20 && e20 < e50 && e50 < e200)
            return 'BEARISH';
        // 2. Scalping Momentum (Faster detection for small pips)
        const last5 = closes.slice(-5);
        const sma5 = last5.reduce((a, b) => a + b, 0) / 5;
        if (current > sma5 && current > e20 && (current - last5[0]) > (current * 0.0005))
            return 'BULLISH';
        if (current < sma5 && current < e20 && (last5[0] - current) > (current * 0.0005))
            return 'BEARISH';
        return 'NEUTRAL';
    }
}
//# sourceMappingURL=technicalAnalyzer.js.map