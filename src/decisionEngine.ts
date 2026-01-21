import { type MarketDataService, type Candle } from './marketDataService.js';
import { TechnicalAnalyzer } from './technicalAnalyzer.js';
import { StructureAnalyzer } from './structureAnalyzer.js';
import { VolatilityEngine } from './volatilityEngine.js';
import { NewsAnalyzer } from './newsAnalyzer.js';
import { ProbabilityEngine, type ProbabilityResult } from './probabilityEngine.js';

export class DecisionEngine {
    /**
     * The PRO MAX iterative decision loop.
     * Analyzes the market 15 times to ensure consistency.
     */
    static async decide(dataService: MarketDataService, symbol: string): Promise<ProbabilityResult | null> {
        const results: ProbabilityResult[] = [];
        const iterations = 20;

        for (let i = 0; i < iterations; i++) {
            const candles1m = dataService.getCandles(symbol, '1m');
            const candles5m = dataService.getCandles(symbol, '5m');
            const candles15m = dataService.getCandles(symbol, '15m');
            const candles1h = dataService.getCandles(symbol, '1h');

            if (candles1m.length < 200) return null;

            const candlesMap = new Map<string, Candle[]>();
            candlesMap.set('1m', candles1m);
            candlesMap.set('5m', candles5m);
            candlesMap.set('15m', candles15m);
            candlesMap.set('1h', candles1h);

            const ta = TechnicalAnalyzer.analyzeTrendConfluence(candlesMap);
            const struct = StructureAnalyzer.detectStructure(candles1m);
            const atr = VolatilityEngine.calculateATR(candles1m);
            const expanding = VolatilityEngine.isExpanding(atr);
            const rsi = TechnicalAnalyzer.calculateRSI(candles1m.map(c => c.close));
            const divergence = TechnicalAnalyzer.detectDivergence(candles1m.map(c => c.close), rsi);
            const news = NewsAnalyzer.checkNewsRisk();
            const channel = TechnicalAnalyzer.detectChannel(candles1m);

            const prob = ProbabilityEngine.calculate({
                ta,
                struct,
                vol: { expanding, ATR: atr[atr.length - 1] || 0 },
                divergence,
                news,
                channel
            });

            results.push(prob);
            if (i < iterations - 1) await new Promise(res => setTimeout(res, 20));
        }

        // CONSENSUS FILTER
        const avgScore = results.reduce((a, b) => a + b.totalScore, 0) / iterations;
        const inconsistency = results.filter(r => Math.abs(r.totalScore - avgScore) > 5).length;

        if (inconsistency > 3) {
            console.log(`[Institutional] ⚠️ Consensus failed for ${symbol} (Inconsistency: ${inconsistency}). Discarding signal.`);
            return null;
        }

        const finalResult = results[results.length - 1]!;
        const minThreshold = 85;

        if (finalResult.totalScore >= minThreshold && finalResult.isSafe) {
            console.log(`[Institutional] ✅ ULTRA SIGNAL APPROVED for ${symbol} | Confidence: ${finalResult.totalScore}%`);
            return finalResult;
        }

        return null;
    }
}
