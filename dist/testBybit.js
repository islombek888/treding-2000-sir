async function testBybit() {
    console.log("🔍 Checking Bybit for Gold and EURUSD...");
    const cases = [
        { symbol: 'PAXGUSDT', name: 'Gold' },
        { symbol: 'EURUSDT', name: 'EUR/USD' }
    ];
    for (const c of cases) {
        try {
            const url = `https://api.bybit.com/v5/market/kline?category=spot&symbol=${c.symbol}&interval=1&limit=5`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.retCode === 0 && data.result && data.result.list) {
                console.log(`✅ Bybit ${c.name} OK! Latest price: ${data.result.list[0][4]}`);
            }
            else {
                console.log(`❌ Bybit ${c.name} FAILED: ${JSON.stringify(data)}`);
            }
        }
        catch (e) {
            console.log(`❌ Bybit ${c.name} Error: ${e}`);
        }
    }
}
testBybit();
export {};
//# sourceMappingURL=testBybit.js.map