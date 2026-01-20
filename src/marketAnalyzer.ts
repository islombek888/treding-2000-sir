import { IndicatorService, type Candle } from './indicatorService.js';

export enum MarketTrend {
    BULLISH = 'BULLISH',
    BEARISH = 'BEARISH',
    RANGING = 'RANGING'
}

export interface MarketState {
    trend: MarketTrend;
    isVolatilityExpanding: boolean;
    hasBOS: boolean;
    hasLiquiditySweep: boolean;
    atr: number;
}

export class MarketAnalyzer {
    /**
     * Analyzes current market state based on indicators and structure
     */
    static analyze(candles: Candle[]): MarketState {
        const closes = candles.map(c => c.close);
        const ema20 = IndicatorService.calculateEMA(closes, 20);
        const ema50 = IndicatorService.calculateEMA(closes, 50);
        const atr = IndicatorService.calculateATR(candles, 14);

        const lastClose = closes[closes.length - 1]!;
        const lastEma20 = ema20[ema20.length - 1]!;
        const lastEma50 = ema50[ema50.length - 1]!;
        const lastAtr = atr[atr.length - 1]!;
        const prevAtr = atr[atr.length - 5] || lastAtr;

        // 1. Trend Detection
        let trend = MarketTrend.RANGING;
        if (lastEma20 > lastEma50 && lastClose > lastEma20) {
            trend = MarketTrend.BULLISH;
        } else if (lastEma20 < lastEma50 && lastClose < lastEma20) {
            trend = MarketTrend.BEARISH;
        }

        // 2. Volatility Expansion (ATR expansion)
        const isVolatilityExpanding = lastAtr > prevAtr * 1.1; // 10% increase in volatility

        // 3. Break of Structure (BOS) - Simplified logic
        const hasBOS = this.detectBOS(candles);

        // 4. Liquidity Sweep - Simplified logic
        const hasLiquiditySweep = this.detectLiquiditySweep(candles);

        return {
            trend,
            isVolatilityExpanding,
            hasBOS,
            hasLiquiditySweep,
            atr: lastAtr
        };
    }

    private static detectBOS(candles: Candle[]): boolean {
        if (candles.length < 20) return false;
        const lastCandle = candles[candles.length - 1]!;
        const recentHighs = candles.slice(-20, -1).map(c => c.high);
        const recentLows = candles.slice(-20, -1).map(c => c.low);

        const maxHigh = Math.max(...recentHighs);
        const minLow = Math.min(...recentLows);

        // Break of structure if close is beyond recent high/low
        return lastCandle.close > maxHigh || lastCandle.close < minLow;
    }

    private static detectLiquiditySweep(candles: Candle[]): boolean {
        if (candles.length < 10) return false;
        const last = candles[candles.length - 1]!;
        const prev = candles.slice(-10, -1);

        const localHigh = Math.max(...prev.map(c => c.high));
        const localLow = Math.min(...prev.map(c => c.low));

        // Sweep: Price goes above high/below low but fails to close beyond it (wick only)
        const sweepHigh = last.high > localHigh && last.close <= localHigh;
        const sweepLow = last.low < localLow && last.close >= localLow;

        return sweepHigh || sweepLow;
    }
}
