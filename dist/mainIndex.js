import { MarketDataService } from './marketDataService.js';
import { AlertService } from './alertService.js';
import { TradingViewDataService } from './tradingViewDataService.js';
import { ChartRenderer } from './chartRenderer.js';
import http from 'http';
// Signal message creator function
function createSignalMessage(signal, pips) {
    const action = signal.action;
    const entry = signal.entry || 0;
    const stopLoss = signal.stopLoss || 0;
    const takeProfit = signal.takeProfit || [];
    const confidence = signal.confidence || 0;
    let message = `🚀 **${action} SIGNAL** 🚀\n\n`;
    message += `📊 **Signal Tafsilotlari:**\n`;
    message += `• Symbol: ${signal.symbol}\n`;
    message += `• Action: ${action}\n`;
    message += `• Entry: ${entry}\n`;
    message += `• Stop Loss: ${stopLoss}\n`;
    message += `• Take Profit: ${takeProfit.join(', ')}\n`;
    message += `• Confidence: ${confidence.toFixed(1)}%\n`;
    message += `• Risk: ${pips} pips\n\n`;
    // Timing instructions
    message += `⏰ **KIRISH VAQTI:**\n`;
    message += `• **DARHOL** kirish tavsiya etiladi!\n`;
    message += `• Signal 5 daqiqa ichida ishga tushishi mumkin\n\n`;
    message += `🎯 **CHIQISH VAQTI:**\n`;
    if (takeProfit.length > 0) {
        message += `• 1-chi TP ga yetganda: ${action === 'BUY' ? 'yarmini yoping' : 'yarmini yoping'}\n`;
        message += `• 2-chi TP ga yetganda: **to'liq yoping**\n`;
        message += `• Stop Loss ishlasa: **darhol yoping**\n\n`;
    }
    message += `⚠️ **MUHIM ESLATMA:**\n`;
    message += `• Risk: 1-2% dan oshmang\n`;
    message += `• Signal faqat 5 daqiqa timeframe uchun\n`;
    message += `• Qarama-qarshi signal kelsa: darhol yoping!\n\n`;
    message += `📈 **Kutilayotgan natija:** ${confidence > 85 ? 'Yuqori' : confidence > 75 ? 'O\'rta' : 'Past'}\n`;
    message += `🎯 **Strategiya:** ${signal.strategy || 'Momentum Analysis'}`;
    return message;
}
// Simple signal management without complex imports
class SimpleSignalManager {
    lastDirection = new Map();
    checkDirectionChange(symbol, newDirection) {
        const lastDir = this.lastDirection.get(symbol);
        if (lastDir === newDirection) {
            return false; // Same direction - block
        }
        this.lastDirection.set(symbol, newDirection);
        return true; // Direction changed - allow
    }
    getLastDirection(symbol) {
        return this.lastDirection.get(symbol) || null;
    }
}
// Simple institutional decision engine
class SimpleDecisionEngine {
    analyze(symbol, candles) {
        if (candles.length < 100)
            return null;
        const current = candles[candles.length - 1];
        if (!current)
            return null;
        // Simple momentum analysis
        const recent = candles.slice(-20);
        const closes = recent.map(c => c.close);
        const momentum = ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100;
        // Generate signal based on momentum
        if (Math.abs(momentum) > 0.3) {
            const action = momentum > 0 ? 'BUY' : 'SELL';
            const atr = this.calculateATR(candles, 14);
            const risk = atr * 1.5;
            return {
                symbol,
                action,
                entry: current.close,
                stopLoss: action === 'BUY' ? current.close - risk : current.close + risk,
                takeProfit: [
                    action === 'BUY' ? current.close + risk : current.close - risk,
                    action === 'BUY' ? current.close + (risk * 2) : current.close - (risk * 2)
                ],
                confidence: Math.min(85 + Math.abs(momentum) * 15, 95),
                strategy: `🔥 Simple Momentum: ${momentum.toFixed(2)}%`
            };
        }
        return null;
    }
    calculateATR(candles, period) {
        if (candles.length < period + 1)
            return 1.0;
        let trSum = 0;
        for (let i = period; i < candles.length; i++) {
            const current = candles[i];
            const previous = candles[i - 1];
            if (!current || !previous)
                continue;
            const high = current.high || 0;
            const low = current.low || 0;
            const prevClose = previous.close || 0;
            const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
            trSum += tr;
        }
        return candles.length > period ? trSum / (candles.length - period) : 1.0;
    }
}
async function main() {
    const dataService = new MarketDataService();
    const tvService = new TradingViewDataService();
    const alertService = AlertService.getInstance();
    const decisionEngine = new SimpleDecisionEngine();
    const signalManager = new SimpleSignalManager();
    const chartRenderer = new ChartRenderer();
    // FAQAT 5 DAQIQA SYMBOLS
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
    console.log("🚀 Simple Multi-Asset Analyst Starting...");
    // Simple HTTP server for Render port binding
    const port = process.env.PORT || 3000;
    http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Bot is running\n');
    }).listen(port, () => {
        console.log(`🌐 Web server listening on port ${port}`);
    });
    // Initial Seed: Fetch historical data to populate engine
    console.log("📥 Seeding market data from TradingView...");
    for (const symbol of symbols) {
        // FAQAT 5 DAQIQA DATA
        const timeframes = ['5m']; // Faqat 5 daqiqa
        for (const tf of timeframes) {
            const candles = await tvService.fetchCandles(symbol, tf, 250);
            candles.forEach(c => dataService.addCandle(symbol, tf, c));
            console.log(`✅ Loaded ${candles.length} candles for ${symbol} (${tf})`);
        }
    }
    // Main Autonomous Loop (Every 20 seconds for high frequency)
    setInterval(async () => {
        console.log(`\n🔍 Analysis Loop: ${new Date().toLocaleTimeString()}`);
        for (const symbol of symbols) {
            try {
                // FAQAT 5 DAQIQA DA ANALIZ
                const m5Candles = dataService.getCandles(symbol, '5m');
                if (m5Candles.length < 100) {
                    console.log(`❌ Insufficient 5m data for ${symbol}`);
                    continue;
                }
                // Simple analysis
                const signal = decisionEngine.analyze(symbol, m5Candles);
                if (signal) {
                    // 🚫 BIR HIL YO'NALISHDA SIGNAL BLOKIROVKASI
                    const canSend = signalManager.checkDirectionChange(symbol, signal.action);
                    if (!canSend) {
                        console.log(`🚫 ${symbol}: Same direction signal blocked (${signal.action})`);
                        console.log(`   Last direction: ${signalManager.getLastDirection(symbol)}, Current: ${signal.action}`);
                        continue;
                    }
                    // ✅ YO'NALISH O'ZGARGANDA SIGNAL BERISH
                    console.log(`🎯 ${symbol}: Direction changed to ${signal.action} - SENDING SIGNAL`);
                    // Signal yuborish
                    const pips = signal.stopLoss && signal.entry ?
                        getPipValue(symbol, Math.abs(signal.entry - signal.stopLoss)) : 0;
                    // Chart yaratish
                    let chartBuffer;
                    try {
                        chartBuffer = await chartRenderer.render(symbol, m5Candles, {
                            entry: signal.entry || 0,
                            sl: signal.stopLoss || 0,
                            tp: signal.takeProfit?.[0] || 0,
                            direction: signal.action
                        });
                        console.log(`📈 Chart created for ${symbol}`);
                    }
                    catch (error) {
                        console.log(`⚠️ Chart creation failed: ${error?.message || error}`);
                    }
                    // Signal message with timing instructions
                    const signalMessage = createSignalMessage(signal, pips);
                    await alertService.sendSignal({
                        symbol: signal.symbol,
                        direction: signal.action,
                        price: signal.entry || 0,
                        pips: pips,
                        confidence: signal.confidence || 0,
                        reason: [signalMessage],
                        atr: 0,
                        strategy: signal.strategy || '',
                        timeframe: '5m',
                        chart: chartBuffer
                    });
                    console.log(`✅ ${symbol}: ${signal.action} signal sent successfully`);
                }
                else {
                    console.log(`ℹ️ ${symbol}: No signal generated (filters not met)`);
                }
            }
            catch (error) {
                console.error(`❌ Error analyzing ${symbol}:`, error?.message || error);
            }
        }
    }, 20000); // Every 20 seconds
    // Add new candle data simulation
    setInterval(async () => {
        for (const symbol of symbols) {
            try {
                const candles = await tvService.fetchCandles(symbol, '5m', 1);
                if (candles.length > 0) {
                    const newCandle = candles[0];
                    if (newCandle) {
                        dataService.addCandle(symbol, '5m', newCandle);
                        console.log(`📈 ${symbol}: New 5m candle added`);
                    }
                }
            }
            catch (error) {
                console.log(`⚠️ Failed to fetch new candle for ${symbol}:`, error?.message || error);
            }
        }
    }, 300000); // Every 5 minutes
    console.log("🎯 Bot is now running with 5-minute only signals and direction filtering");
    console.log("📋 Rules:");
    console.log("   • Only 5-minute timeframe analysis");
    console.log("   • Block same-direction consecutive signals");
    console.log("   • Only send signals when direction changes");
    console.log("   • Simple momentum analysis");
}
// Error handling
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});
main().catch(console.error);
//# sourceMappingURL=mainIndex.js.map