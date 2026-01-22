import { TradingViewDataService } from './tradingViewDataService.js';
import dotenv from 'dotenv';
dotenv.config();

async function testSymbols() {
    const apiKey = process.env.MARKET_DATA_API_KEY;
    const resolutions = ['1', '5'];

    // Different formats for EURUSD and GOLD
    const testCases = [
        { name: 'EURUSD (OANDA)', symbol: 'OANDA:EUR_USD' },
        { name: 'EURUSD (Forex)', symbol: 'EUR_USD' },
        { name: 'XAUUSD (OANDA)', symbol: 'OANDA:XAU_USD' },
        { name: 'XAUUSD (Normal)', symbol: 'XAU_USD' },
        { name: 'XAUUSD (Crypto alternative)', symbol: 'FX:XAUUSD' }
    ];

    console.log("🔍 Testing Finnhub symbols for Free Tier...");

    for (const test of testCases) {
        try {
            const url = `https://finnhub.io/api/v1/forex/candle?symbol=${test.symbol}&resolution=1&from=${Math.floor(Date.now() / 1000 - 3600)}&to=${Math.floor(Date.now() / 1000)}&token=${apiKey}`;
            const res = await fetch(url);
            const data: any = await res.json();

            if (data.s === 'ok') {
                console.log(`✅ ${test.name} OK! (${test.symbol})`);
            } else {
                console.log(`❌ ${test.name} FAILED: ${data.error || data.s} (${test.symbol})`);
            }
        } catch (e) {
            console.log(`❌ ${test.name} Error.`);
        }
    }
}

testSymbols();
