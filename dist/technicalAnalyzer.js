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
    static detectChannel(candles) {
        if (candles.length < 20)
            return 'NONE';
        const closes = candles.slice(-20).map(c => c.close);
        let higherHighs = 0;
        let higherLows = 0;
        let lowerHighs = 0;
        let lowerLows = 0;
        for (let i = 1; i < candles.slice(-20).length; i++) {
            const current = candles[candles.length - 20 + i];
            const prev = candles[candles.length - 20 + i - 1];
            if (current.high > prev.high)
                higherHighs++;
            if (current.low > prev.low)
                higherLows++;
            if (current.high < prev.high)
                lowerHighs++;
            if (current.low < prev.low)
                lowerLows++;
        }
        if (higherHighs > 10 && higherLows > 10)
            return 'ASCENDING';
        if (lowerHighs > 10 && lowerLows > 10)
            return 'DESCENDING';
        return 'NONE';
    }
    static detectStructure(candles) {
        if (candles.length < 20)
            return { type: 'NONE', direction: 'NONE' };
        const recent = candles.slice(-20);
        const last = recent[recent.length - 1];
        const prevHigh = Math.max(...recent.slice(0, -1).map(c => c.high));
        const prevLow = Math.min(...recent.slice(0, -1).map(c => c.low));
        // Break of Structure (BOS)
        if (last.close > prevHigh)
            return { type: 'BOS', direction: 'BULLISH' };
        if (last.close < prevLow)
            return { type: 'BOS', direction: 'BEARISH' };
        // Liquidity Sweep (Fake breakout)
        if (last.high > prevHigh && last.close < prevHigh)
            return { type: 'SWEEP', direction: 'BEARISH' };
        if (last.low < prevLow && last.close > prevLow)
            return { type: 'SWEEP', direction: 'BULLISH' };
        return { type: 'NONE', direction: 'NONE' };
    }
    static analyzeTrendConfluence(candlesMap) {
        const tfs = ['1m', '5m', '15m', '1h'];
        let bullishScores = 0;
        let bearishScores = 0;
        for (const tf of tfs) {
            const candles = candlesMap.get(tf);
            if (!candles || candles.length < 50)
                continue;
            const closes = candles.map(c => c.close);
            const ema20 = this.calculateEMA(closes, 20);
            const ema50 = this.calculateEMA(closes, 50);
            if (ema20.length === 0 || ema50.length === 0)
                continue;
            const e20 = ema20[ema20.length - 1];
            const e50 = ema50[ema50.length - 1];
            const current = closes[closes.length - 1];
            if (current > e20 && e20 > e50)
                bullishScores++;
            if (current < e20 && e20 < e50)
                bearishScores++;
        }
        if (bullishScores >= 3)
            return 'BULLISH';
        if (bearishScores >= 3)
            return 'BEARISH';
        return 'NEUTRAL';
    }
}
//# sourceMappingURL=technicalAnalyzer.js.map