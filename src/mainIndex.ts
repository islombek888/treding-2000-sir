import { MarketDataService, type Timeframe } from './marketDataService.js';
import { InstitutionalDecisionEngine, type InstitutionalSignal } from './institutionalDecisionEngine.js';
import { AlertService } from './alertService.js';
import { SignalManagerService } from './signalManagerService.js';
import { TradingViewDataService } from './tradingViewDataService.js';
import http from 'http';

async function main() {
    const dataService = new MarketDataService();
    const tvService = new TradingViewDataService();
    const alertService = AlertService.getInstance();
    const decisionEngine = new InstitutionalDecisionEngine(dataService);
    const signalManager = new SignalManagerService(alertService);
    
    // FAQAT 5 DAQIQA SYMBOLS
    const symbols = ['XAUUSD', 'EURUSD'];
    
    function getPipValue(symbol: string, diff: number): number {
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

    // Initial Seed: Fetch historical data to populate engine
    console.log("📥 Seeding market data from TradingView...");
    for (const symbol of symbols) {
        // FAQAT 5 DAQIQA DATA
        const timeframes: Timeframe[] = ['5m']; // Faqat 5 daqiqa
        for (const tf of timeframes) {
            const candles = await tvService.fetchCandles(symbol, tf, 250);
            candles.forEach(c => dataService.addCandle(symbol, tf, c));
            console.log(`✅ Loaded ${candles.length} candles for ${symbol} (${tf})`);
        }
    }

    // State for tracking last signal direction per symbol
    const lastSignalDirection = new Map<string, 'BUY' | 'SELL' | null>();
    
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

                // Institutional analysis
                const signal = await decisionEngine.analyze(symbol);
                
                if (signal) {
                    const action = signal.action === 'BUY' || signal.action === 'SELL' ? signal.action : 'BUY';
                    
                    // 🚫 BIR HIL YO'NALISHDA SIGNAL BLOKIROVKASI
                    const lastDirection = lastSignalDirection.get(symbol);
                    
                    if (lastDirection === action) {
                        console.log(`🚫 ${symbol}: Same direction signal blocked (${action} -> ${action})`);
                        console.log(`   Waiting for direction change before sending new signal`);
                        continue;
                    }
                    
                    // ✅ YO'NALISH O'ZGARGANDA SIGNAL BERISH
                    console.log(`🎯 ${symbol}: Direction changed from ${lastDirection || 'NONE'} to ${action}`);
                    
                    // Signal manager orqali yuborish
                    const canSend = await signalManager.processSignal(signal);
                    
                    if (canSend) {
                        // Yo'nalishni saqlash
                        lastSignalDirection.set(symbol, action);
                        
                        // Signal yuborish
                        const pips = signal.stopLoss && signal.entry ? 
                            getPipValue(symbol, Math.abs(signal.entry - signal.stopLoss)) : 0;
                        
                        await alertService.sendSignal({
                            symbol: signal.symbol,
                            direction: action,
                            price: signal.entry || 0,
                            pips: pips,
                            confidence: signal.confidence || 0,
                            reason: signal.strategy ? [signal.strategy] : [],
                            atr: 0,
                            strategy: signal.strategy || '',
                            timeframe: '5m',
                            chart: signal.chart
                        });
                        
                        console.log(`✅ ${symbol}: ${action} signal sent successfully`);
                    } else {
                        console.log(`⚠️ ${symbol}: Signal blocked by manager (conflict/limit)`);
                    }
                } else {
                    console.log(`ℹ️ ${symbol}: No signal generated (filters not met)`);
                }
                
            } catch (error: any) {
                console.error(`❌ Error analyzing ${symbol}:`, error?.message || error);
            }
        }
        
        console.log(`📊 Active signals: ${Array.from(signalManager.getActiveSignals().keys()).join(', ')}`);
        
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
            } catch (error: any) {
                console.log(`⚠️ Failed to fetch new candle for ${symbol}:`, error?.message || error);
            }
        }
    }, 300000); // Every 5 minutes

    console.log("🎯 Bot is now running with 5-minute only signals and direction filtering");
    console.log("📋 Rules:");
    console.log("   • Only 5-minute timeframe analysis");
    console.log("   • Block same-direction consecutive signals");
    console.log("   • Only send signals when direction changes");
    console.log("   • Advanced institutional filters applied");
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

main().catch(console.error);
