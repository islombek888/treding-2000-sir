import { MarketDataService, type Candle } from './marketDataService.js';
import { DecisionEngine } from './decisionEngine.js';
import { AlertService } from './alertService.js';
import { VolatilityEngine } from './volatilityEngine.js';
import { ChartRenderer } from './chartRenderer.js';
import { SignalArchiveService } from './signalArchiveService.js';
import { TradingViewDataService } from './tradingViewDataService.js';
import http from 'http';

async function main() {
    const dataService = new MarketDataService();
    const tvService = new TradingViewDataService();
    const alertService = AlertService.getInstance();

    const symbols = ['XAUUSD', 'EURUSD'];

    function getPipValue(symbol: string, diff: number): number {
        if (symbol === 'XAUUSD') {
            return Math.round(Math.abs(diff) * 100);
        } else if (symbol === 'EURUSD') {
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

    // Initial Seed: Fetch historical data to populate the engine
    console.log("📥 Seeding market data from Finnhub...");
    for (const symbol of symbols) {
        const timeframes: ('1m' | '5m' | '15m' | '1h')[] = ['1m', '5m', '15m', '1h'];
        for (const tf of timeframes) {
            const candles = await tvService.fetchCandles(symbol, tf, 250);
            candles.forEach(c => dataService.addCandle(symbol, tf, c));
            console.log(`✅ Loaded ${candles.length} candles for ${symbol} (${tf})`);
        }
    }

    // State for Cooldown tracking per symbol and timeframe
    const signalCooldowns = new Map<string, { time: number; direction: string }>();
    const activeTrades = new Map<string, { direction: string; entry: number; tp: number; sl: number; time: number }>();

    // Main Autonomous Loop (Every 20 seconds for high frequency)
    setInterval(async () => {
        console.log(`\n🔍 Analysis Loop: ${new Date().toLocaleTimeString()}`);

        for (const symbol of symbols) {
            const timeframes: ('1m' | '5m' | '15m')[] = ['1m', '5m', '15m'];

            for (const tf of timeframes) {
                try {
                    const latestCandles = await tvService.fetchCandles(symbol, tf, 50);
                    if (latestCandles.length === 0) continue;

                    // Sync data service
                    latestCandles.forEach(c => dataService.addCandle(symbol, tf, c));

                    const currentPrice = dataService.getLatestPrice(symbol);
                    if (!currentPrice) continue;

                    // Check Active Trade Status (TP/SL/Reversal)
                    const activeTradeKey = `${symbol}_${tf}`;
                    const activeTrade = activeTrades.get(activeTradeKey);

                    if (activeTrade) {
                        // Check Take Profit
                        if ((activeTrade.direction === 'BUY' && currentPrice >= activeTrade.tp) ||
                            (activeTrade.direction === 'SELL' && currentPrice <= activeTrade.tp)) {
                            const gain = getPipValue(symbol, currentPrice - activeTrade.entry);
                            alertService.sendTakeProfitAlert(symbol, currentPrice, Math.abs(gain));
                            activeTrades.delete(activeTradeKey);
                            continue; // Trade closed
                        }
                    }

                    // Run the decision engine
                    const decision = await DecisionEngine.decide(dataService, symbol);

                    if (decision) {
                        const candles = dataService.getCandles(symbol, tf);
                        if (candles.length < 12) continue;

                        const lastClose = currentPrice;
                        const prevClose = candles[candles.length - 2]?.close || candles[candles.length - 1]!.close;
                        const pips = getPipValue(symbol, lastClose - prevClose);
                        const direction = lastClose > prevClose ? 'BUY' : 'SELL';

                        // Cooldown check (Reduced for 1m scalping)
                        const cooldownKey = `${symbol}_${tf}`;
                        const lastSignal = signalCooldowns.get(cooldownKey);
                        const now = Date.now();
                        const cooldownLimit = tf === '1m' ? 60000 : 5 * 60000; // 1 min for 1m, 5 min for others

                        if (lastSignal && (now - lastSignal.time) < cooldownLimit) continue;

                        // REVERSAL CHECK
                        if (activeTrade && activeTrade.direction !== direction) {
                            alertService.sendClosureAlert(symbol, activeTrade.direction, currentPrice, "Trend Reversed (New Signal)");
                            activeTrades.delete(activeTradeKey);
                        }

                        // Lower thresholds: 1m (10 pts = 1 pip), 5m/15m (Standard)
                        // User requested 1 pips sensitivity
                        const forexThreshold = tf === '1m' ? 1 : 3;
                        const goldThreshold = tf === '1m' ? 10 : 30; // 10 points = 1 pip

                        const threshold = symbol === 'EURUSD' ? forexThreshold : goldThreshold;

                        if (Math.abs(pips) >= threshold) {
                            const atr = VolatilityEngine.calculateATR(candles);
                            const currentAtr = atr[atr.length - 1] || 0;

                            const isBuy = direction === 'BUY';
                            const sl = isBuy ? lastClose - (currentAtr * 1.5) : lastClose + (currentAtr * 1.5);
                            const tp = isBuy ? lastClose + (currentAtr * 2.0) : lastClose - (currentAtr * 2.0);

                            const renderer = new ChartRenderer();
                            const chart = await renderer.render(symbol, candles.slice(-12), {
                                entry: lastClose,
                                sl,
                                tp,
                                direction: direction
                            }, {
                                bos: { price: lastClose, type: isBuy ? 'BULLISH' : 'BEARISH' }
                            });

                            signalCooldowns.set(cooldownKey, { time: now, direction });
                            activeTrades.set(activeTradeKey, { direction, entry: lastClose, tp, sl, time: now });

                            alertService.sendSignal({
                                symbol,
                                direction: direction,
                                price: lastClose,
                                pips: pips,
                                confidence: decision.totalScore,
                                reason: decision.confluenceList,
                                atr: currentAtr,
                                strategy: `${decision.strategy} (${tf})`,
                                chart,
                                timeframe: tf,
                                macro: decision.macro
                            });

                            console.log(`🎯 [${tf}] SIGNAL SENT for ${symbol}: ${direction} at ${lastClose}`);
                        }
                    }
                } catch (error) {
                    console.error(`❌ Error processing ${symbol} (${tf}):`, error);
                }
            }
        }
    }, 20000);
}

main().catch(error => {
    console.error("💥 System Crash:", error);
});
