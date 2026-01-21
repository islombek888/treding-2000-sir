import { MarketDataService } from './marketDataService.js';
import { DecisionEngine } from './decisionEngine.js';
import { AlertService } from './alertService.js';
import { VolatilityEngine } from './volatilityEngine.js';
import { ChartRenderer } from './chartRenderer.js';
import { SignalArchiveService } from './signalArchiveService.js';
import http from 'http';
async function main() {
    const dataService = new MarketDataService();
    const alertService = AlertService.getInstance();
    const symbols = ['XAUUSD'];
    console.log("🚀 Institutional XAUUSD Analyst Starting...");
    // ... (server setup remains same) ...
    // Initial state for simulation per symbol
    const symbolStates = new Map();
    symbols.forEach(s => {
        const startPrice = 2050.0;
        symbolStates.set(s, { price: startPrice, trend: 0, trendDuration: 0 });
        // Seed with 300 candles
        let price = startPrice;
        const trendBias = (Math.random() - 0.5) * 0.0001;
        for (let i = 0; i < 300; i++) {
            price += (Math.random() - 0.5) * (startPrice * 0.0005) + (startPrice * trendBias);
            dataService.addCandle(s, '1m', {
                timestamp: Date.now() - (300 - i) * 60000,
                open: price,
                high: price + (startPrice * 0.0005),
                low: price - (startPrice * 0.0005),
                close: price,
                volume: 1000
            });
        }
        symbolStates.get(s).price = price;
    });
    // Main Autonomous Loop
    setInterval(async () => {
        for (const symbol of symbols) {
            const state = symbolStates.get(symbol);
            const startPrice = 2050.0;
            // INTENSE TREND SIMULATION
            if (state.trendDuration <= 0) {
                const dir = Math.random() > 0.5 ? 1 : -1;
                state.trend = dir * (Math.random() * 0.004 + 0.002);
                state.trendDuration = 40 + Math.floor(Math.random() * 60);
            }
            const volatility = (Math.random() > 0.96) ? 4.0 : 1.3;
            const move = (state.trend * startPrice * volatility) + (Math.random() - 0.5) * (startPrice * 0.0004);
            state.price += move;
            state.trendDuration--;
            // Add candle for 1m
            dataService.addCandle(symbol, '1m', {
                timestamp: Date.now(),
                open: state.price - move,
                high: state.price + (Math.abs(move) * 0.6),
                low: state.price - (Math.abs(move) * 0.6),
                close: state.price,
                volume: 8000
            });
            // Run the decision engine
            const decision = await DecisionEngine.decide(dataService, symbol);
            if (decision) {
                const candles = dataService.getCandles(symbol, '1m');
                const lastClose = state.price;
                const prevClose = candles[candles.length - 20]?.close || lastClose;
                const pips = Math.round(Math.abs(lastClose - prevClose) * 100);
                if (pips >= 50) {
                    const atr = VolatilityEngine.calculateATR(candles);
                    const currentAtr = atr[atr.length - 1] || 0;
                    // Calculate SL/TP for Chart
                    const isBuy = lastClose > prevClose;
                    const sl = isBuy ? lastClose - (currentAtr * 1.6) : lastClose + (currentAtr * 1.6);
                    const tp = isBuy ? lastClose + (currentAtr * 2.4) : lastClose - (currentAtr * 2.4);
                    // Generate Chart Image
                    const renderer = new ChartRenderer();
                    const chart = await renderer.render(symbol, candles.slice(-50), {
                        entry: lastClose,
                        sl,
                        tp,
                        direction: isBuy ? 'BUY' : 'SELL'
                    }, {
                        bos: { price: lastClose, type: isBuy ? 'BULLISH' : 'BEARISH' }
                    });
                    // Archive the signal
                    const archiver = new SignalArchiveService();
                    archiver.archive({
                        timestamp: Date.now(),
                        symbol,
                        direction: isBuy ? 'BUY' : 'SELL',
                        entry: lastClose,
                        sl,
                        tp,
                        pips,
                        confidence: decision.totalScore,
                        strategy: decision.strategy,
                        result: 'PENDING'
                    });
                    alertService.sendSignal({
                        symbol,
                        direction: isBuy ? 'BUY' : 'SELL',
                        price: lastClose,
                        pips: pips,
                        confidence: decision.totalScore,
                        reason: decision.confluenceList,
                        atr: currentAtr,
                        strategy: decision.strategy,
                        chart
                    });
                }
            }
        }
    }, 12000);
}
main().catch(error => {
    console.error("💥 System Crash:", error);
});
//# sourceMappingURL=index.js.map