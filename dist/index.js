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
    const symbols = ['XAUUSD', 'EURUSD'];
    function getPipValue(symbol, diff) {
        if (symbol === 'XAUUSD') {
            return Math.round(Math.abs(diff) * 100);
        }
        else if (symbol === 'EURUSD') {
            return Math.round(Math.abs(diff) * 10000);
        }
        return Math.round(Math.abs(diff));
    }
    console.log("🚀 Institutional Multi-Asset Analyst Starting...");
    // Simple HTTP server for Render port binding
    const port = process.env.PORT || 3000;
    http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Bot is running\n');
    }).listen(port, () => {
        console.log(`🌐 Web server listening on port ${port}`);
    });
    // Initial state for simulation per symbol
    const symbolStates = new Map();
    symbols.forEach(s => {
        const startPrice = s === 'XAUUSD' ? 2050.0 : 1.1000;
        symbolStates.set(s, { price: startPrice, trend: 0, trendDuration: 0 });
        // Seed with 300 candles
        let price = startPrice;
        const trendBias = (Math.random() - 0.5) * 0.0001;
        const volatilityFactor = s === 'XAUUSD' ? 0.0005 : 0.0002;
        for (let i = 0; i < 300; i++) {
            price += (Math.random() - 0.5) * (startPrice * volatilityFactor) + (startPrice * trendBias);
            dataService.addCandle(s, '1m', {
                timestamp: Date.now() - (300 - i) * 60000,
                open: price,
                high: price + (startPrice * volatilityFactor),
                low: price - (startPrice * volatilityFactor),
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
            const startPrice = symbol === 'XAUUSD' ? 2050.0 : 1.1000;
            // INTENSE TREND SIMULATION
            if (state.trendDuration <= 0) {
                const dir = Math.random() > 0.5 ? 1 : -1;
                const trendPower = symbol === 'XAUUSD' ? (Math.random() * 0.004 + 0.002) : (Math.random() * 0.001 + 0.0005);
                state.trend = dir * trendPower;
                state.trendDuration = 40 + Math.floor(Math.random() * 60);
            }
            const volatility = (Math.random() > 0.96) ? 4.0 : 1.3;
            const noise = symbol === 'XAUUSD' ? 0.0004 : 0.0001;
            const move = (state.trend * startPrice * volatility) + (Math.random() - 0.5) * (startPrice * noise);
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
                const pips = getPipValue(symbol, lastClose - prevClose);
                if (pips >= 5) {
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