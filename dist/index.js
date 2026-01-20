import { MarketDataService } from './marketDataService.js';
import { DecisionEngine } from './decisionEngine.js';
import { AlertService } from './alertService.js';
import http from 'http';
async function main() {
    const dataService = new MarketDataService();
    const alertService = new AlertService();
    const symbols = [
        'XAUUSD', 'EURUSD', 'GBPUSD', 'USDCHF',
        'USDJPY', 'USDCNH', 'USDRUB', 'AUDUSD',
        'NZDUSD', 'USDCAD', 'BTCUSDT', 'ETHUSDT'
    ];
    console.log("🚀 PRO MAX Autonomous system starting for symbols:", symbols.join(", "));
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
        let startPrice = 1.0;
        if (s === 'XAUUSD')
            startPrice = 2050.0;
        else if (s === 'USDJPY')
            startPrice = 150.0;
        else if (s === 'BTCUSDT')
            startPrice = 45000.0;
        else if (s === 'ETHUSDT')
            startPrice = 2500.0;
        else if (s === 'USDRUB')
            startPrice = 90.0;
        symbolStates.set(s, { price: startPrice });
        // Seed with 250 candles
        let price = startPrice;
        for (let i = 0; i < 250; i++) {
            price += (Math.random() - 0.5) * (startPrice * 0.001);
            dataService.addCandle(s, '1m', {
                timestamp: Date.now() - (250 - i) * 60000,
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
            const startPrice = (symbol === 'XAUUSD' ? 2050 : 1.0); // reference for move size
            // Simulating price movement
            const move = (Math.random() > 0.98) ? (startPrice * 0.005) : (Math.random() - 0.5) * (startPrice * 0.0005);
            state.price += move;
            dataService.addCandle(symbol, '1m', {
                timestamp: Date.now(),
                open: state.price - move,
                high: state.price + (startPrice * 0.0002),
                low: state.price - (startPrice * 0.0002),
                close: state.price,
                volume: 1500
            });
            // Run the decision engine
            const decision = await DecisionEngine.decide(dataService, symbol);
            if (decision) {
                const candles = dataService.getCandles(symbol, '1m');
                const lastClose = state.price;
                const prevClose = candles[candles.length - 20]?.close || lastClose;
                // Pips calculation (simplified for different assets)
                let pips = 0;
                if (symbol === 'XAUUSD') {
                    pips = Math.round(Math.abs(lastClose - prevClose) * 100);
                }
                else if (symbol.includes('JPY')) {
                    pips = Math.round(Math.abs(lastClose - prevClose) * 100);
                }
                else if (symbol.includes('USDT')) { // Crypto
                    pips = Math.round(Math.abs(lastClose - prevClose));
                }
                else {
                    pips = Math.round(Math.abs(lastClose - prevClose) * 10000);
                }
                // Minimum 20 pips requirement as requested
                if (pips >= 20) {
                    alertService.sendSignal({
                        symbol,
                        direction: lastClose > prevClose ? 'BUY' : 'SELL',
                        price: lastClose,
                        pips: pips,
                        confidence: decision.totalScore,
                        reason: decision.confluenceList
                    });
                }
            }
        }
    }, 10000); // Check every 10 seconds for more symbols
}
main().catch(error => {
    console.error("💥 System Crash:", error);
});
//# sourceMappingURL=index.js.map