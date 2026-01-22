import { TradingViewDataService } from './tradingViewDataService.js';
import dotenv from 'dotenv';
dotenv.config();

async function verify() {
    const tvService = new TradingViewDataService();
    console.log("🔍 Verifying Finnhub API connection...");

    const symbols = ['XAUUSD', 'EURUSD'];

    for (const symbol of symbols) {
        try {
            console.log(`\nTesting ${symbol}...`);
            const candles = await tvService.fetchCandles(symbol, '1m', 5);
            if (candles.length > 0) {
                console.log(`✅ Success! Fetched ${candles.length} candles.`);
                console.log(`Latest Price: ${candles[candles.length - 1]!.close}`);
            } else {
                console.log(`⚠️ No data returned for ${symbol}. Check API Key or Symbol.`);
            }
        } catch (error) {
            console.error(`❌ Error for ${symbol}:`, error);
        }
    }
}

verify();
