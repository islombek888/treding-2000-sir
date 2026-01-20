import { VolatilityEngine } from './volatilityEngine.js';

describe('VolatilityEngine', () => {
    it('should detect expansion correctly', () => {
        const atr = [0.1, 0.1, 0.1, 0.1, 0.1, 0.2]; // Big jump
        expect(VolatilityEngine.isExpanding(atr)).toBe(true);
    });

    it('should detect compression correctly', () => {
        const atr = [0.5, 0.5, 0.5, 0.5, 0.5, 0.1, 0.1, 0.1, 0.1, 0.1];
        expect(VolatilityEngine.isCompressing(atr)).toBe(true);
    });
});
