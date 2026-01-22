import { type Candle } from './marketDataService.js';

export class TechnicalAnalyzer {
    static calculateEMA(data: number[], period: number): number[] {
        if (data.length < period) return [];
        const ema: number[] = [];
        const k = 2 / (period + 1);

        let sma = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
        ema[period - 1] = sma;

        for (let i = period; i < data.length; i++) {
            ema.push((data[i]! - ema[ema.length - 1]!) * k + ema[ema.length - 1]!);
        }
        return ema;
    }

    static calculateRSI(data: number[], period: number = 14): number[] {
        if (data.length <= period) return [];
        const rsi: number[] = [];
        const gains: number[] = [];
        const losses: number[] = [];

        for (let i = 1; i < data.length; i++) {
            const diff = data[i]! - data[i - 1]!;
            gains.push(diff > 0 ? diff : 0);
            losses.push(diff < 0 ? Math.abs(diff) : 0);
        }

        let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
        let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

        rsi[period] = 100 - (100 / (1 + (avgGain / (avgLoss || 0.00001))));

        for (let i = period + 1; i < data.length; i++) {
            avgGain = (avgGain * (period - 1) + gains[i - 1]!) / period;
            avgLoss = (avgLoss * (period - 1) + losses[i - 1]!) / period;
            rsi[i] = 100 - (100 / (1 + (avgGain / (avgLoss || 0.00001))));
        }

        return rsi;
    }

    static detectDivergence(prices: number[], rsi: number[], lookback: number = 20): 'BULLISH' | 'BEARISH' | 'NONE' {
        if (prices.length < lookback || rsi.length < lookback) return 'NONE';

        const lastPrice = prices[prices.length - 1]!;
        const prevPrice = prices[prices.length - lookback]!;
        const lastRsi = rsi[rsi.length - 1]!;
        const prevRsi = rsi[rsi.length - lookback]!;

        // Bullish Divergence: Price Lower Low, RSI Higher Low
        if (lastPrice < prevPrice && lastRsi > prevRsi && lastRsi < 40) return 'BULLISH';

        // Bearish Divergence: Price Higher High, RSI Lower High
        if (lastPrice > prevPrice && lastRsi < prevRsi && lastRsi > 60) return 'BEARISH';

        return 'NONE';
    }

    static detectChannel(candles: Candle[]): 'ASCENDING' | 'DESCENDING' | 'NONE' {
        if (candles.length < 20) return 'NONE';
        const closes = candles.slice(-20).map(c => c.close);

        let higherHighs = 0;
        let higherLows = 0;
        let lowerHighs = 0;
        let lowerLows = 0;

        for (let i = 1; i < candles.slice(-20).length; i++) {
            const current = candles[candles.length - 20 + i]!;
            const prev = candles[candles.length - 20 + i - 1]!;

            if (current.high > prev.high) higherHighs++;
            if (current.low > prev.low) higherLows++;
            if (current.high < prev.high) lowerHighs++;
            if (current.low < prev.low) lowerLows++;
        }

        if (higherHighs > 10 && higherLows > 10) return 'ASCENDING';
        if (lowerHighs > 10 && lowerLows > 10) return 'DESCENDING';

        return 'NONE';
    }

    static detectStructure(candles: Candle[]): { type: 'BOS' | 'SWEEP' | 'NONE'; direction: 'BULLISH' | 'BEARISH' | 'NONE' } {
        if (candles.length < 20) return { type: 'NONE', direction: 'NONE' };

        const recent = candles.slice(-20);
        const last = recent[recent.length - 1]!;
        const prevHigh = Math.max(...recent.slice(0, -1).map(c => c.high));
        const prevLow = Math.min(...recent.slice(0, -1).map(c => c.low));

        // Break of Structure (BOS)
        if (last.close > prevHigh) return { type: 'BOS', direction: 'BULLISH' };
        if (last.close < prevLow) return { type: 'BOS', direction: 'BEARISH' };

        // Liquidity Sweep (Fake breakout)
        if (last.high > prevHigh && last.close < prevHigh) return { type: 'SWEEP', direction: 'BEARISH' };
        if (last.low < prevLow && last.close > prevLow) return { type: 'SWEEP', direction: 'BULLISH' };

        return { type: 'NONE', direction: 'NONE' };
    }

    static detectMarketPhase(candles: Candle[]): 'EXPANSION' | 'COMPRESSION' | 'NONE' {
        if (candles.length < 20) return 'NONE';

        const closes = candles.slice(-20).map(c => c.close);
        const atr = this.calculateATR(closes);
        if (atr.length < 2) return 'NONE';

        const lastAtr = atr[atr.length - 1]!;
        const prevAtr = atr[atr.length - 10] || atr[0]!;

        // Expansion: volatility increasing
        if (lastAtr > prevAtr * 1.2) return 'EXPANSION';

        // Compression: price in tight range
        const high = Math.max(...closes);
        const low = Math.min(...closes);
        const range = ((high - low) / low) * 100;

        if (range < 0.1) return 'COMPRESSION';

        return 'NONE';
    }

    static calculateATR(closes: number[], period: number = 14): number[] {
        // Wrapper for index.ts consistency if needed, but we use VolatilityEngine mostly
        // Here we implement a simple one for internal phase detection
        const atr: number[] = [];
        for (let i = 1; i < closes.length; i++) {
            atr.push(Math.abs(closes[i]! - closes[i - 1]!));
        }
        return atr;
    }

    static analyzeTrendConfluence(candlesMap: Map<string, Candle[]>): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
        const tfs: ('1m' | '5m' | '15m' | '1h')[] = ['1m', '5m', '15m', '1h'];
        let bullishScores = 0;
        let bearishScores = 0;

        for (const tf of tfs) {
            const candles = candlesMap.get(tf);
            if (!candles || candles.length < 50) continue;

            const closes = candles.map(c => c.close);
            const ema20 = this.calculateEMA(closes, 20);
            const ema50 = this.calculateEMA(closes, 50);

            if (ema20.length === 0 || ema50.length === 0) continue;

            const e20 = ema20[ema20.length - 1]!;
            const e50 = ema50[ema50.length - 1]!;
            const current = closes[closes.length - 1]!;

            if (current > e20 && e20 > e50) bullishScores++;
            if (current < e20 && e20 < e50) bearishScores++;
        }

        if (bullishScores >= 3) return 'BULLISH';
        if (bearishScores >= 3) return 'BEARISH';

        return 'NEUTRAL';
    }

    static analyzeMacroStructure(candlesMap: Map<string, Candle[]>): { trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; target: number; duration: string } {
        // Use 1H or 4H candles (approximated by aggregating 1H) for macro
        const h1Candles = candlesMap.get('1h') || [];
        if (h1Candles.length < 50) {
            return { trend: 'NEUTRAL', target: 0, duration: 'Unknown' };
        }

        const closes = h1Candles.map(c => c.close);
        const currentPrice = closes[closes.length - 1]!;
        const ema50 = this.calculateEMA(closes, 50);
        const ema20 = this.calculateEMA(closes, 20);

        const e50 = ema50[ema50.length - 1] || currentPrice;
        const e20 = ema20[ema20.length - 1] || currentPrice;

        // 1. Determine Global Trend
        let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
        if (currentPrice > e20 && e20 > e50) trend = 'BULLISH';
        else if (currentPrice < e20 && e20 < e50) trend = 'BEARISH';

        // 2. Calculate Target Price (Based on ATR projection and pivots)
        const atr = this.calculateATR(closes, 14);
        const currentAtr = atr[atr.length - 1] || 0;
        const dailyRange = currentAtr * 24; // Approx daily range

        let target = 0;
        if (trend === 'BULLISH') {
            // Find next resistance (local high)
            const recentHigh = Math.max(...h1Candles.slice(-20).map(c => c.high));
            target = recentHigh > currentPrice ? recentHigh : currentPrice + (dailyRange * 0.5);
            // If already at high, project further
            if (target - currentPrice < currentAtr) target = currentPrice + (currentAtr * 3);
        } else if (trend === 'BEARISH') {
            const recentLow = Math.min(...h1Candles.slice(-20).map(c => c.low));
            target = recentLow < currentPrice ? recentLow : currentPrice - (dailyRange * 0.5);
            if (currentPrice - target < currentAtr) target = currentPrice - (currentAtr * 3);
        } else {
            target = currentPrice;
        }

        // 3. Estimate Duration
        // We look at how many candles it usually takes to move such distance
        const distance = Math.abs(target - currentPrice);
        const avgCandleBody = closes.map((c, i) => i > 0 ? Math.abs(c - closes[i - 1]!) : 0).reduce((a, b) => a + b, 0) / closes.length;
        const candlesToTarget = Math.ceil(distance / avgCandleBody);

        const hours = Math.max(1, Math.min(candlesToTarget, 8)); // Cap between 1 and 8 hours
        const duration = `~${hours}-${hours + 2} soat`;

        return { trend, target, duration };
    }
}
