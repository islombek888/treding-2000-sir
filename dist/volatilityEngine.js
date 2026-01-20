import {} from './marketDataService.js';
export class VolatilityEngine {
    static calculateATR(candles, period = 14) {
        if (candles.length <= period)
            return [];
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
            avgTr = (avgTr * (period - 1) + tr[i - 1]) / period;
            atr[i] = avgTr;
        }
        return atr;
    }
    static isExpanding(atr) {
        if (atr.length < 5)
            return false;
        const current = atr[atr.length - 1];
        const prev = atr[atr.length - 5];
        return current > prev * 1.15; // 15% expansion
    }
    static isCompressing(atr) {
        if (atr.length < 10)
            return false;
        const recent = atr.slice(-5);
        const older = atr.slice(-10, -5);
        const avgRecent = recent.reduce((a, b) => a + b, 0) / 5;
        const avgOlder = older.reduce((a, b) => a + b, 0) / 5;
        return avgRecent < avgOlder * 0.9; // 10% compression
    }
}
//# sourceMappingURL=volatilityEngine.js.map