import { TechnicalAnalyzer } from './technicalAnalyzer.js';

describe('TechnicalAnalyzer', () => {
    it('should calculate EMA correctly', () => {
        const data = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
        const ema = TechnicalAnalyzer.calculateEMA(data, 5);
        expect(ema.length).toBe(11); // Returns array of same size as data
        expect(ema[ema.length - 1]).toBeCloseTo(18, 0);
    });

    it('should calculate RSI correctly', () => {
        const data = Array.from({ length: 30 }, (_, i) => i + 10);
        const rsi = TechnicalAnalyzer.calculateRSI(data, 14);
        expect(rsi[rsi.length - 1]).toBeGreaterThan(99);
    });

    it('should detect divergence', () => {
        const prices = [100, 105, 102, 108, 110]; // Price Higher High
        const rsi = [70, 75, 65, 78, 65];         // RSI Lower High (at the end)
        const div = TechnicalAnalyzer.detectDivergence(prices, rsi, 4);
        expect(div).toBe('BEARISH');
    });
});
