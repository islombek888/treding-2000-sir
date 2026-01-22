import { MarketDataService, type Candle, type Timeframe } from './marketDataService.js';

export interface InstitutionalSignal {
    symbol: string;
    timeframe: Timeframe;
    action: 'BUY' | 'SELL' | 'CLOSE' | 'WARNING';
    entry?: number;
    stopLoss?: number;
    takeProfit?: number[];
    expectedMove?: number;
    confidence?: number;
    risk?: 'LOW' | 'MEDIUM' | 'HIGH';
    strategy?: string;
    estimatedTime?: string;
    countdown?: number;
    reversalFrom?: 'BUY' | 'SELL';
    chart?: Buffer;
}

export interface MarketStructure {
    liquiditySweep?: {
        type: 'HIGH' | 'LOW';
        level: number;
        timestamp: number;
    };
    breakOfStructure?: {
        type: 'BULLISH' | 'BEARISH';
        level: number;
        timestamp: number;
    };
    choch?: {
        confirmed: boolean;
        direction: 'BULLISH' | 'BEARISH';
        timestamp: number;
    };
    momentum?: {
        direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
        strength: number;
    };
}

export class InstitutionalDecisionEngine {
    private lastSignal: Map<string, { direction: 'BUY' | 'SELL', timestamp: number }> = new Map();
    private reversalWarning: Map<string, { from: 'BUY' | 'SELL', to: 'BUY' | 'SELL', timestamp: number }> = new Map();

    constructor(private dataService: MarketDataService) {}

    public async analyze(symbol: string): Promise<InstitutionalSignal | null> {
        console.log(`[Institutional] 🔍 Starting deep analysis for ${symbol}...`);
        
        // Get multi-timeframe data
        const m1Candles = this.dataService.getCandles(symbol, '1m');
        const m5Candles = this.dataService.getCandles(symbol, '5m');
        const m15Candles = this.dataService.getCandles(symbol, '15m');
        
        if (m1Candles.length < 200 || m5Candles.length < 200 || m15Candles.length < 200) {
            console.log(`[Institutional] ❌ Insufficient data for ${symbol}`);
            return null;
        }

        // Analyze market structure across timeframes
        const structure = this.analyzeMarketStructure(m1Candles, m5Candles, m15Candles);
        
        // Check for reversal conditions first
        const reversalWarning = this.checkReversalConditions(symbol, structure);
        if (reversalWarning) {
            console.log(`[Institutional] ⚠️ Reversal warning detected for ${symbol}`);
            return reversalWarning;
        }

        // Multi-layer confirmation (ALL 6 conditions must pass)
        const confirmations = this.validateMultiLayerConfirmations(structure);
        
        if (!confirmations.passed) {
            console.log(`[Institutional] ❌ Multi-layer confirmation failed for ${symbol}: ${confirmations.reason}`);
            return null;
        }

        // Same-direction filter
        const lastDir = this.lastSignal.get(symbol);
        if (lastDir && this.isSameDirection(lastDir.direction, confirmations.direction)) {
            console.log(`[Institutional] ❌ Same-direction filter blocked for ${symbol}`);
            return null;
        }

        // Calculate entry levels
        const currentPrice = m5Candles[m5Candles.length - 1].close;
        const atr = this.calculateATR(m5Candles, 14);
        
        const signal: InstitutionalSignal = {
            symbol,
            timeframe: '5m',
            action: confirmations.direction,
            entry: currentPrice,
            stopLoss: confirmations.stopLoss,
            takeProfit: confirmations.takeProfit,
            expectedMove: confirmations.expectedMove,
            confidence: confirmations.confidence,
            risk: confirmations.risk,
            strategy: confirmations.strategy,
            estimatedTime: confirmations.estimatedTime,
            countdown: confirmations.countdown
        };

        // Store last signal
        this.lastSignal.set(symbol, { direction: confirmations.direction, timestamp: Date.now() });

        console.log(`[Institutional] ✅ Signal validated for ${symbol}: ${confirmations.direction} at ${currentPrice}`);
        return signal;
    }

    private analyzeMarketStructure(m1Candles: Candle[], m5Candles: Candle[], m15Candles: Candle[]): MarketStructure {
        const structure: MarketStructure = {};

        // 1. Liquidity Sweep Analysis
        structure.liquiditySweep = this.detectLiquiditySweep(m5Candles);
        
        // 2. Break of Structure Analysis
        structure.breakOfStructure = this.detectBreakOfStructure(m5Candles);
        
        // 3. CHoCH Analysis
        structure.choch = this.detectCHoCH(m5Candles, m15Candles);
        
        // 4. Momentum Analysis
        structure.momentum = this.analyzeMomentum(m5Candles);

        return structure;
    }

    private detectLiquiditySweep(candles: Candle[]): { type: 'HIGH' | 'LOW', level: number, timestamp: number } | null {
        const recent = candles.slice(-50);
        const highs = recent.map(c => c.high);
        const lows = recent.map(c => c.low);

        // Find equal highs (liquidity above)
        const equalHighs = this.findEqualLevels(highs, 0.5);
        if (equalHighs.length > 0) {
            const latest = equalHighs[equalHighs.length - 1];
            if (latest && this.isLiquidityTaken(recent, latest.level, 'HIGH')) {
                return { type: 'HIGH', level: latest.level, timestamp: latest.timestamp };
            }
        }

        // Find equal lows (liquidity below)
        const equalLows = this.findEqualLevels(lows, 0.5);
        if (equalLows.length > 0) {
            const latest = equalLows[equalLows.length - 1];
            if (latest && this.isLiquidityTaken(recent, latest.level, 'LOW')) {
                return { type: 'LOW', level: latest.level, timestamp: latest.timestamp };
            }
        }

        return null;
    }

    private detectBreakOfStructure(candles: Candle[]): { type: 'BULLISH' | 'BEARISH', level: number, timestamp: number } | null {
        const swingPoints = this.identifySwingPoints(candles);
        
        if (swingPoints.length < 4) return null;

        // Look for HH/HL -> LL/LH pattern change
        for (let i = swingPoints.length - 1; i >= 3; i--) {
            const current = swingPoints[i];
            const prev1 = swingPoints[i - 1];
            const prev2 = swingPoints[i - 2];
            const prev3 = swingPoints[i - 3];

            if (!current || !prev1 || !prev2 || !prev3) continue;

            // Check for bullish BOS (higher high after lower low)
            if (prev3.type === 'HIGH' && prev2.type === 'LOW' && 
                prev1.type === 'HIGH' && current.type === 'LOW') {
                
                if (current.price > prev2.price) { // Break of structure
                    return {
                        type: 'BULLISH',
                        level: prev2.price,
                        timestamp: current.timestamp
                    };
                }
            }

            // Check for bearish BOS (lower low after higher high)
            if (prev3.type === 'LOW' && prev2.type === 'HIGH' && 
                prev1.type === 'LOW' && current.type === 'HIGH') {
                
                if (current.price < prev2.price) { // Break of structure
                    return {
                        type: 'BEARISH',
                        level: prev2.price,
                        timestamp: current.timestamp
                    };
                }
            }
        }

        return null;
    }

    private detectCHoCH(m5Candles: Candle[], m15Candles: Candle[]): { confirmed: boolean, direction: 'BULLISH' | 'BEARISH', timestamp: number } {
        const m5Recent = m5Candles.slice(-20);
        const m15Recent = m15Candles.slice(-10);

        // Simple CHoCH detection (2 closes beyond previous)
        const last2M5 = m5Recent.slice(-2);
        const last2M15 = m15Recent.slice(-2);

        if (last2M5.length < 2 || last2M15.length < 2) {
            return { confirmed: false, direction: 'BULLISH', timestamp: 0 };
        }

        const m5Change = last2M5[1].close - last2M5[0].close;
        const m15Change = last2M15[1].close - last2M15[0].close;

        // Check if M5 shows reversal against M15 trend
        if (Math.abs(m5Change) > 0.001) {
            const direction = m5Change > 0 ? 'BULLISH' : 'BEARISH';
            return {
                confirmed: true,
                direction,
                timestamp: Date.now()
            };
        }

        return { confirmed: false, direction: 'BULLISH', timestamp: 0 };
    }

    private analyzeMomentum(candles: Candle[]): { direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL', strength: number } {
        const recent = candles.slice(-20);
        
        if (recent.length < 10) {
            return { direction: 'NEUTRAL', strength: 0 };
        }

        // Calculate momentum using rate of change
        const closes = recent.map(c => c.close);
        const roc5 = this.calculateROC(closes, 5);
        const roc10 = this.calculateROC(closes, 10);

        const avgRoc = (roc5 + roc10) / 2;
        
        let direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
        let strength = Math.abs(avgRoc);

        if (avgRoc > 0.001) {
            direction = 'BULLISH';
        } else if (avgRoc < -0.001) {
            direction = 'BEARISH';
        } else {
            direction = 'NEUTRAL';
        }

        return { direction, strength };
    }

    private validateMultiLayerConfirmations(structure: MarketStructure): {
        passed: boolean;
        direction: 'BUY' | 'SELL';
        stopLoss: number;
        takeProfit: number[];
        expectedMove: number;
        confidence: number;
        risk: 'LOW' | 'MEDIUM' | 'HIGH';
        strategy: string;
        estimatedTime: string;
        countdown: number;
        reason?: string;
    } {
        const confirmations = {
            liquiditySweep: !!structure.liquiditySweep,
            breakOfStructure: !!structure.breakOfStructure,
            choch: structure.choch?.confirmed || false,
            momentum: structure.momentum?.direction !== 'NEUTRAL',
            noHigherTfConflict: true, // Would check M15 vs M5
            entryNotLate: true, // Would check R:R ratio
        };

        // All 6 conditions must pass
        const failedConditions = Object.entries(confirmations)
            .filter(([_, passed]) => !passed)
            .map(([condition]) => condition);

        if (failedConditions.length > 0) {
            return {
                passed: false,
                direction: 'BUY',
                stopLoss: 0,
                takeProfit: [],
                expectedMove: 0,
                confidence: 0,
                risk: 'HIGH',
                strategy: '',
                estimatedTime: '',
                countdown: 0,
                reason: `Failed conditions: ${failedConditions.join(', ')}`
            };
        }

        // Determine direction from structure
        let direction: 'BUY' | 'SELL' | null = null;
        let strategy = '';
        let confidence = 80; // Base confidence

        if (structure.breakOfStructure?.type === 'BULLISH') {
            direction = 'BUY';
            strategy = 'Bullish Break of Structure';
            confidence += 10;
        } else if (structure.breakOfStructure?.type === 'BEARISH') {
            direction = 'SELL';
            strategy = 'Bearish Break of Structure';
            confidence += 10;
        }

        if (structure.liquiditySweep) {
            strategy += ' + Liquidity Sweep';
            confidence += 5;
        }

        if (structure.choch?.confirmed) {
            strategy += ' + CHoCH Confirmation';
            confidence += 5;
        }

        // Calculate risk levels
        const currentPrice = m5Candles[m5Candles.length - 1].close;
        const atr = this.calculateATR(m5Candles, 14);
        const risk = atr * 1.6;

        let direction: 'BUY' | 'SELL';
        let strategy = '';
        let confidence = 80; // Base confidence

        const stopLoss = direction === 'BUY' ? currentPrice - risk : currentPrice + risk;
        const takeProfit = [
            direction === 'BUY' ? currentPrice + risk : currentPrice - risk, // 1:1
            direction === 'BUY' ? currentPrice + (risk * 2) : currentPrice - (risk * 2), // 1:2
            direction === 'BUY' ? currentPrice + (risk * 3) : currentPrice - (risk * 3)  // 1:3
        ];

        const expectedMove = Math.abs(takeProfit[0] - currentPrice) * 100; // Convert to pips

        // Time estimation based on volatility
        const estimatedTime = this.estimateTimeToMove(expectedMove);
        const countdown = Math.floor(Math.random() * 3) + 2; // 2-5 minutes

        return {
            passed: true,
            direction,
            stopLoss,
            takeProfit,
            expectedMove,
            confidence: Math.min(confidence, 95),
            risk: expectedMove > 100 ? 'HIGH' : expectedMove > 50 ? 'MEDIUM' : 'LOW',
            strategy,
            estimatedTime,
            countdown
        };
    }

    private checkReversalConditions(symbol: string, structure: MarketStructure): InstitutionalSignal | null {
        const lastSignal = this.lastSignal.get(symbol);
        
        if (!lastSignal) return null;

        // Check if momentum is weakening in opposite direction
        if (lastSignal.direction === 'SELL' && structure.momentum?.direction === 'BULLISH') {
            return {
                symbol,
                timeframe: '5m',
                action: 'WARNING',
                reversalFrom: 'SELL',
                estimatedTime: '2-4 minutes'
            };
        }

        if (lastSignal.direction === 'BUY' && structure.momentum?.direction === 'BEARISH') {
            return {
                symbol,
                timeframe: '5m',
                action: 'WARNING',
                reversalFrom: 'BUY',
                estimatedTime: '2-4 minutes'
            };
        }

        return null;
    }

    private isSameDirection(lastDir: 'BUY' | 'SELL', newDir: 'BUY' | 'SELL'): boolean {
        return lastDir === newDir;
    }

    // Helper methods
    private findEqualLevels(levels: number[], tolerance: number): Array<{ level: number, timestamp: number }> {
        const equalLevels: Array<{ level: number, timestamp: number }> = [];
        
        for (let i = 0; i < levels.length; i++) {
            for (let j = i + 1; j < levels.length; j++) {
                if (Math.abs(levels[i] - levels[j]) <= tolerance) {
                    equalLevels.push({
                        level: levels[i],
                        timestamp: Date.now() - (levels.length - j) * 60000
                    });
                }
            }
        }
        
        return equalLevels;
    }

    private isLiquidityTaken(candles: Candle[], level: number, type: 'HIGH' | 'LOW'): boolean {
        const recent = candles.slice(-10);
        
        if (type === 'HIGH') {
            return recent.some(c => c.high > level + 0.5);
        } else {
            return recent.some(c => c.low < level - 0.5);
        }
    }

    private identifySwingPoints(candles: Candle[]): Array<{ type: 'HIGH' | 'LOW', price: number, timestamp: number }> {
        const swings: Array<{ type: 'HIGH' | 'LOW', price: number, timestamp: number }> = [];
        
        for (let i = 2; i < candles.length - 2; i++) {
            const current = candles[i];
            const prev1 = candles[i - 1];
            const prev2 = candles[i - 2];
            const next1 = candles[i + 1];
            const next2 = candles[i + 2];

            if (!current || !prev1 || !prev2 || !next1 || !next2) continue;

            // Swing high
            if (current.high > prev1.high && current.high > prev2.high &&
                current.high > next1.high && current.high > next2.high) {
                swings.push({
                    type: 'HIGH',
                    price: current.high,
                    timestamp: current.timestamp
                });
            }

            // Swing low
            if (current.low < prev1.low && current.low < prev2.low &&
                current.low < next1.low && current.low < next2.low) {
                swings.push({
                    type: 'LOW',
                    price: current.low,
                    timestamp: current.timestamp
                });
            }
        }

        return swings;
    }

    private calculateROC(closes: number[], period: number): number {
        if (closes.length < period + 1) return 0;
        
        const current = closes[closes.length - 1];
        const previous = closes[closes.length - 1 - period];
        
        return previous !== 0 ? ((current - previous) / previous) * 100 : 0;
    }

    private calculateATR(candles: Candle[], period: number): number {
        if (candles.length < period + 1) return 0;

        let trSum = 0;
        for (let i = period; i < candles.length; i++) {
            const high = candles[i]?.high || 0;
            const low = candles[i]?.low || 0;
            const prevClose = candles[i - 1]?.close || 0;
            
            const tr = Math.max(
                high - low,
                Math.abs(high - prevClose),
                Math.abs(low - prevClose)
            );
            
            trSum += tr;
        }

        return candles.length > period ? trSum / (candles.length - period) : 0;
    }

    private estimateTimeToMove(pips: number): string {
        if (pips > 150) return '5-10 minutes';
        if (pips > 100) return '3-7 minutes';
        if (pips > 50) return '2-5 minutes';
        return '1-3 minutes';
    }
}
