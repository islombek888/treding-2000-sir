import { MarketDataService, type Candle } from './marketDataService.js';
import { DecisionEngine } from './decisionEngine.js';
import { AlertService } from './alertService.js';
import http from 'http';

async function main() {
    const dataService = new MarketDataService();
    const alertService = AlertService.getInstance();

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
    const symbolStates = new Map<string, { price: number; trend: number; trendDuration: number }>();
    symbols.forEach(s => {
        let startPrice = 1.0;
        if (s === 'XAUUSD') startPrice = 2050.0;
        else if (s === 'USDJPY') startPrice = 150.0;
        else if (s === 'BTCUSDT') startPrice = 45000.0;
        else if (s === 'ETHUSDT') startPrice = 2500.0;
        else if (s === 'USDRUB') startPrice = 90.0;

        symbolStates.set(s, { price: startPrice, trend: 0, trendDuration: 0 });

        // Seed with 300 candles of a slight trend to ensure EMA 200 is useful
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
        symbolStates.get(s)!.price = price;
    });

    // Main Autonomous Loop
    setInterval(async () => {
        for (const symbol of symbols) {
            const state = symbolStates.get(symbol)!;
            const startPrice = (symbol === 'XAUUSD' ? 2050 : (symbol.includes('USDT') ? 1000 : 1.0));

            // SMART TREND SIMULATION
            if (state.trendDuration <= 0) {
                // Change trend every 20-50 iterations
                state.trend = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 0.002);
                state.trendDuration = 20 + Math.floor(Math.random() * 30);
            }

            const volatility = (Math.random() > 0.9) ? 2.5 : 1.0; // Random volatility spike
            const move = (state.trend * startPrice * volatility) + (Math.random() - 0.5) * (startPrice * 0.0005);

            state.price += move;
            state.trendDuration--;

            dataService.addCandle(symbol, '1m', {
                timestamp: Date.now(),
                open: state.price - move,
                high: state.price + (startPrice * 0.001 * volatility),
                low: state.price - (startPrice * 0.001 * volatility),
                close: state.price,
                volume: 2000
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
                } else if (symbol.includes('JPY')) {
                    pips = Math.round(Math.abs(lastClose - prevClose) * 100);
                } else if (symbol.includes('USDT')) { // Crypto
                    pips = Math.round(Math.abs(lastClose - prevClose));
                } else {
                    pips = Math.round(Math.abs(lastClose - prevClose) * 10000);
                }

                // Minimum 15 pips requirement as requested
                if (pips >= 15) {
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
