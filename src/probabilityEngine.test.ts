import { ProbabilityEngine } from './probabilityEngine.js';

describe('ProbabilityEngine', () => {
    it('should calculate high confidence score for clear confluence', () => {
        const result = ProbabilityEngine.calculate({
            ta: 'BULLISH',
            struct: { bos: true, sweep: false },
            vol: { expanding: true, ATR: 0.5 },
            divergence: 'BULLISH',
            news: { status: 'SAFE', events: [] }
        });

        expect(result.totalScore).toBe(80); // 30 (TA) + 15 (BOS) + 20 (Vol) + 15 (Div)
        expect(result.isSafe).toBe(true);
    });

    it('should block signals during news', () => {
        const result = ProbabilityEngine.calculate({
            ta: 'BULLISH',
            struct: { bos: true, sweep: false },
            vol: { expanding: true, ATR: 0.5 },
            divergence: 'BULLISH',
            news: { status: 'BLOCK', events: ['CPI'] }
        });

        expect(result.totalScore).toBe(0);
        expect(result.isSafe).toBe(false);
    });
});
