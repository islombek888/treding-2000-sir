import {} from './marketDataService.js';
import { TechnicalAnalyzer } from './technicalAnalyzer.js';
import { StructureAnalyzer } from './structureAnalyzer.js';
import { VolatilityEngine } from './volatilityEngine.js';
import { NewsAnalyzer } from './newsAnalyzer.js';
import { ProbabilityEngine } from './probabilityEngine.js';
export class DecisionEngine {
    /**
     * The PRO MAX iterative decision loop.
     * Analyzes the market 15 times to ensure consistency.
     */
    static async decide(dataService, symbol) {
        const results = [];
        const iterations = 15;
        for (let i = 0; i < iterations; i++) {
            const candles = dataService.getCandles(symbol, '1m'); // Using 1m for entry precision
            if (candles.length < 200)
                return null;
            const closes = candles.map(c => c.close);
            const ta = TechnicalAnalyzer.analyzeTrendConfluence(candles);
            const struct = StructureAnalyzer.detectStructure(candles);
            const atr = VolatilityEngine.calculateATR(candles);
            const expanding = VolatilityEngine.isExpanding(atr);
            const rsi = TechnicalAnalyzer.calculateRSI(closes);
            const divergence = TechnicalAnalyzer.detectDivergence(closes, rsi);
            const news = NewsAnalyzer.checkNewsRisk();
            const prob = ProbabilityEngine.calculate({
                ta,
                struct,
                vol: { expanding, ATR: atr[atr.length - 1] || 0 },
                divergence,
                news
            });
            results.push(prob);
            // Artificial delay to simulate real-time iterative re-check if needed,
            // or just to vary the "sampling" slightly if prices are shifting.
            if (i < iterations - 1)
                await new Promise(res => setTimeout(res, 50));
        }
        // CONSENSUS CHECK: If results vary wildly, cancel.
        const avgScore = results.reduce((a, b) => a + b.totalScore, 0) / iterations;
        const variance = results.filter(r => Math.abs(r.totalScore - avgScore) > 10).length;
        if (variance > 3) {
            console.log(`[Decision] Inconsistent results (variance: ${variance}). Cancelling signal.`);
            return null;
        }
        const finalResult = results[results.length - 1];
        if (finalResult.totalScore >= 80 && finalResult.isSafe) {
            console.log(`[Decision] ✅ Signal APPROVED for ${symbol} with confidence ${finalResult.totalScore}%`);
            return finalResult;
        }
        if (finalResult.totalScore > 0) {
            console.log(`[Decision] ❌ Signal REJECTED for ${symbol} (Score: ${finalResult.totalScore}%, Safety: ${finalResult.isSafe})`);
        }
        return null;
    }
}
//# sourceMappingURL=decisionEngine.js.map