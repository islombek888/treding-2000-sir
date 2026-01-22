async function testBinance() {
    console.log("🔍 Checking Binance for Gold and EURUSD...");
    const symbols = ['PAXGUSDT', 'EURUSDT'];

    for (const s of symbols) {
        try {
            const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${s}&interval=1m&limit=5`);
            const data: any = await res.json();
            if (Array.isArray(data)) {
                console.log(`✅ Binance ${s} OK! Pulse: ${data[data.length - 1][4]}`);
            } else {
                console.log(`❌ Binance ${s} FAILED.`);
            }
        } catch (e) {
            console.log(`❌ Binance ${s} Error.`);
        }
    }
}

testBinance();
