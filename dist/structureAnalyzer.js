import {} from './marketDataService.js';
export class StructureAnalyzer {
    static detectStructure(candles) {
        if (candles.length < 20)
            return { type: 'NONE', bos: false, sweep: false };
        const last = candles[candles.length - 1];
        const prev = candles.slice(-20, -1);
        const highest = Math.max(...prev.map(c => c.high));
        const lowest = Math.min(...prev.map(c => c.low));
        // Break of Structure (BOS)
        const bos = last.close > highest || last.close < lowest;
        // Liquidity Sweep (fakes)
        const sweepHigh = last.high > highest && last.close <= highest;
        const sweepLow = last.low < lowest && last.close >= lowest;
        let type = 'NONE';
        const currentHigh = last.high;
        const currentLow = last.low;
        const prevHigh = prev[prev.length - 1].high;
        const prevLow = prev[prev.length - 1].low;
        if (currentHigh > prevHigh && currentLow > prevLow)
            type = 'HH';
        else if (currentHigh < prevHigh && currentLow < prevLow)
            type = 'LL';
        else if (currentHigh > prevHigh && currentLow <= prevLow)
            type = 'HL'; // Simplified
        else if (currentHigh <= prevHigh && currentLow < prevLow)
            type = 'LH'; // Simplified
        return { type, bos, sweep: sweepHigh || sweepLow };
    }
}
//# sourceMappingURL=structureAnalyzer.js.map