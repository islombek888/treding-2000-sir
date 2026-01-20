import { StructureAnalyzer } from './structureAnalyzer.js';

describe('StructureAnalyzer', () => {
    it('should detect BOS on price breakout', () => {
        const candles: any[] = Array.from({ length: 20 }, (_, i) => ({
            high: 100, low: 90, close: 95
        }));
        candles.push({ high: 110, low: 101, close: 105 }); // New high

        const result = StructureAnalyzer.detectStructure(candles);
        expect(result.bos).toBe(true);
        expect(result.type).toBe('HH');
    });

    it('should detect liquidity sweep', () => {
        const candles: any[] = Array.from({ length: 20 }, (_, i) => ({
            high: 100, low: 90, close: 95
        }));
        candles.push({ high: 105, low: 98, close: 95 }); // Wick above 100, close below 100

        const result = StructureAnalyzer.detectStructure(candles);
        expect(result.sweep).toBe(true);
    });
});
