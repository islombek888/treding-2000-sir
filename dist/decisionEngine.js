import {} from './marketDataService.js';
import { TechnicalAnalyzer } from './technicalAnalyzer.js';
import { VolatilityEngine } from './volatilityEngine.js';
import { NewsAnalyzer } from './newsAnalyzer.js';
import { ProbabilityEngine } from './probabilityEngine.js';
export class DecisionEngine {
    /**
     * The PRO MAX iterative decision loop.
     * Analyzes the market 15 times to ensure consistency.
     */
    static async decide(dataService, symbol) {
        const candles1m = dataService.getCandles(symbol, '1m');
        if (candles1m.length < 200)
            return null;
        // Step 1: Chart Reading (Behavior Detection)
        const phase = TechnicalAnalyzer.detectMarketPhase(candles1m);
        if (phase === 'NONE') {
            console.log(`[Institutional] ⚠️ Market phase unclear for ${symbol}. Staying silent.`);
            return null;
        }
        console.log(`[Institutional] 🔍 Phase detected: ${phase}`);
        const strategyPrefix = phase === 'EXPANSION' ? 'Institutional Expansion' : 'Range Liquidity';
        const results = [];
        const iterations = 15;
        const candles5m = dataService.getCandles(symbol, '5m');
        const candles15m = dataService.getCandles(symbol, '15m');
        const candles1h = dataService.getCandles(symbol, '1h');
        const candlesMap = new Map();
        candlesMap.set('1m', candles1m);
        candlesMap.set('5m', candles5m);
        candlesMap.set('15m', candles15m);
        candlesMap.set('1h', candles1h);
        for (let i = 0; i < iterations; i++) {
            const ta = TechnicalAnalyzer.analyzeTrendConfluence(candlesMap);
            const struct = TechnicalAnalyzer.detectStructure(candles1m);
            const atr = VolatilityEngine.calculateATR(candles1m);
            const vol = { expanding: VolatilityEngine.isExpanding(atr), ATR: atr[atr.length - 1] || 0 };
            const rsi = TechnicalAnalyzer.calculateRSI(candles1m.map(c => c.close));
            const divergence = TechnicalAnalyzer.detectDivergence(candles1m.map(c => c.close), rsi);
            const news = NewsAnalyzer.checkNewsRisk();
            const channel = TechnicalAnalyzer.detectChannel(candles1m);
            // NEW: Macro Structure Analysis
            const macro = TechnicalAnalyzer.analyzeMacroStructure(candlesMap);
            const result = ProbabilityEngine.calculate({
                ta,
                struct,
                vol,
                divergence,
                news,
                channel,
                macro // Passing macro analysis
            });
            // Attach macro to result for final output
            result.macro = macro;
            results.push(result);
            if (i < iterations - 1)
                await new Promise(res => setTimeout(res, 20));
        }
        // Consensus & Strategy Refinement
        const avgScore = results.reduce((a, b) => a + b.totalScore, 0) / iterations;
        const inconsistencies = results.filter(r => Math.abs(r.totalScore - avgScore) > 5).length;
        const finalResult = results[results.length - 1];
        console.log(`[Institutional] 📊 Final Result for ${symbol}: Score: ${avgScore.toFixed(2)}, Confluences: ${finalResult.confluenceList.join(', ')}`);
        if (inconsistencies > 3 || avgScore < 50) {
            console.log(`[Institutional] ⚠️ Consensus failed for ${symbol} (Score: ${avgScore.toFixed(2)}, Inconsistency: ${inconsistencies}).`);
            return null;
        }
        if (finalResult.strategy === 'Universal Institutional Model') {
            finalResult.strategy = `${strategyPrefix} Model`;
        }
        console.log(`[Institutional] ✅ ULTRA SIGNAL APPROVED for ${symbol} | Confidence: ${finalResult.totalScore}%`);
        return finalResult;
    }
}
//# sourceMappingURL=decisionEngine.js.map