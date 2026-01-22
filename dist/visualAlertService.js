import { VisualAnalyzer } from './visualAnalyzer.js';
import { MarketDataService } from './marketDataService.js';
import { AlertService } from './alertService.js';
import fs from 'fs';
import path from 'path';
export class VisualAlertService {
    visualAnalyzer;
    alertService;
    lastAnalysisTime = 0;
    analysisInterval = 60000; // Analyze every minute
    constructor(marketDataService) {
        this.visualAnalyzer = new VisualAnalyzer(marketDataService);
        this.alertService = AlertService.getInstance();
    }
    async analyzeAndVisualize() {
        const now = Date.now();
        if (now - this.lastAnalysisTime < this.analysisInterval) {
            return;
        }
        this.lastAnalysisTime = now;
        try {
            console.log("🔍 Starting XAUUSD visual analysis...");
            // Analyze XAUUSD for entry signal
            const signal = this.visualAnalyzer.analyzeXAUUSD();
            if (signal) {
                console.log(`📈 ${signal.direction} signal detected! Confidence: ${signal.confidence}%, Expected: ${signal.expectedPips} pips`);
                // Generate chart
                const chartPath = await this.visualAnalyzer.generateChart(signal);
                console.log(`📊 Chart generated: ${chartPath}`);
                // Send visual signal to subscribers
                await this.sendVisualSignal(signal, chartPath);
                // Also send regular signal for compatibility
                await this.alertService.sendSignal({
                    symbol: 'XAUUSD',
                    direction: signal.direction,
                    price: signal.entryPrice,
                    pips: signal.expectedPips,
                    confidence: signal.confidence,
                    reason: signal.reason,
                    atr: 2.5, // Default ATR for XAUUSD
                    strategy: 'Visual Analysis Strategy',
                    timeframe: '5m' // Default for visual engine
                });
            }
            else {
                console.log("⚠️ No high-confidence setup found for XAUUSD");
            }
        }
        catch (error) {
            console.error("❌ Error in visual analysis:", error);
        }
    }
    async sendVisualSignal(signal, chartPath) {
        try {
            // Read chart image
            const chartBuffer = fs.readFileSync(chartPath);
            // Create enhanced message with chart analysis
            const message = `
🎯 *ADVANCED XAUUSD VISUAL ANALYSIS* 📊

📍 *Direction:* ${signal.direction === 'BUY' ? '🟢 BUY' : '🔴 SELL'}
📊 *Entry Price:* ${signal.entryPrice.toFixed(2)}
🛡️ *Stop Loss:* ${signal.stopLoss.toFixed(2)}
🎯 *Take Profit:* ${signal.takeProfit.toFixed(2)}
📈 *Expected Move:* ${signal.expectedPips} Pips
🔬 *Confidence:* ${signal.confidence}%

📝 *Technical Analysis:*
${signal.reason.map(r => `• ${r}`).join('\n')}

✅ *Confirmation:* ${signal.confirmation}

⏰ *Time Window:* 10-25 Minutes
📊 *Chart:* Professional TradingView-style analysis attached

⚠️ This is an advanced visual analysis with clear entry logic and risk management.
            `;
            console.log(message);
            // Here you would send the chart image to Telegram
            // For now, we'll just log that the chart was generated
            console.log(`📸 Visual chart ready for Telegram: ${chartPath}`);
        }
        catch (error) {
            console.error("❌ Error sending visual signal:", error);
        }
    }
    getLatestChart() {
        const chartPath = path.resolve(process.cwd(), 'xauusd_analysis.png');
        if (fs.existsSync(chartPath)) {
            return chartPath;
        }
        return null;
    }
}
//# sourceMappingURL=visualAlertService.js.map