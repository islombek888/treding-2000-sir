import { MarketDataService } from './dist/marketDataService.js';
import { VisualAlertService } from './dist/visualAlertService.js';

async function testVisualAnalysis() {
    console.log("🧪 Testing Visual Analysis System...");
    
    const dataService = new MarketDataService();
    const visualService = new VisualAlertService(dataService);
    
    // Add some test data for XAUUSD
    const symbol = 'XAUUSD';
    let price = 2050.0;
    
    console.log("📊 Generating test candle data...");
    
    // Generate 200 candles with some structure
    for (let i = 0; i < 200; i++) {
        // Create strong bullish structure
        let move;
        if (i < 50) {
            // Initial downtrend
            move = -0.3 + (Math.random() - 0.5) * 0.2;
        } else if (i < 100) {
            // Accumulation
            move = (Math.random() - 0.5) * 0.1;
        } else if (i < 150) {
            // Strong breakout up
            move = 0.8 + (Math.random() - 0.5) * 0.3;
        } else {
            // Continuation
            move = 0.4 + (Math.random() - 0.5) * 0.2;
        }
        
        price += move;
        
        dataService.addCandle(symbol, '1m', {
            timestamp: Date.now() - (200 - i) * 60000,
            open: price - move,
            high: price + Math.abs(move) * 0.6,
            low: price - Math.abs(move) * 0.6,
            close: price,
            volume: 1000 + Math.random() * 2000
        });
    }
    
    console.log("✅ Test data generated. Running visual analysis...");
    
    try {
        await visualService.analyzeAndVisualize();
        console.log("🎉 Visual analysis completed successfully!");
        
        // Check if chart was generated
        const fs = await import('fs');
        if (fs.existsSync('xauusd_analysis.png')) {
            console.log("📈 Chart image generated: xauusd_analysis.png");
        } else {
            console.log("⚠️ No chart image generated");
        }
        
    } catch (error) {
        console.error("❌ Visual analysis failed:", error);
    }
}

testVisualAnalysis().then(() => {
    console.log("🏁 Test completed");
    process.exit(0);
}).catch(error => {
    console.error("💥 Test failed:", error);
    process.exit(1);
});
