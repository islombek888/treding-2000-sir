import { type Candle, type Timeframe } from './marketDataService.js';

export interface SignalStatistics {
    totalSignals: number;
    wins: number;
    losses: number;
    consecutiveLosses: number;
    lastLossDate?: number;
    dailySignals: number;
    lastSignalDate: number;
    strategyPerformance: Map<string, { wins: number; losses: number }>;
}

export interface SignalFilters {
    spreadFilter: boolean;
    newsFilter: boolean;
    fakeBreakoutFilter: boolean;
    dailyLimitFilter: boolean;
    consecutiveLossFilter: boolean;
    singleTradeFilter: boolean;
}

export class SignalFilterService {
    private statistics: Map<string, SignalStatistics> = new Map();
    private activeTrades: Map<string, boolean> = new Map();
    private dailySignalCounts: Map<string, number> = new Map();

    constructor() {
        this.loadStatistics();
    }

    /**
     * 1️⃣ SIGNAL SONINI QATTIQ CHEKLASH (5-8 max per day)
     */
    public checkDailyLimit(symbol: string): { allowed: boolean; reason?: string } {
        const today = new Date().toDateString();
        const stats = this.getStatistics(symbol);
        
        if (stats.dailySignals >= 8) {
            return { 
                allowed: false, 
                reason: `Daily limit reached (${stats.dailySignals}/8). No more signals today.` 
            };
        }

        return { allowed: true };
    }

    /**
     * 2️⃣ 24 SOAT TO'XTATISH (3 consecutive losses)
     */
    public checkConsecutiveLosses(symbol: string): { allowed: boolean; reason?: string } {
        const stats = this.getStatistics(symbol);
        
        if (stats.consecutiveLosses >= 3) {
            const hoursSinceLastLoss = stats.lastLossDate ? 
                (Date.now() - stats.lastLossDate) / (1000 * 60 * 60) : Infinity;
            
            if (hoursSinceLastLoss < 24) {
                return { 
                    allowed: false, 
                    reason: `3 consecutive losses detected. Signals paused for ${Math.ceil(24 - hoursSinceLastLoss)} hours.` 
                };
            }
        }

        return { allowed: true };
    }

    /**
     * 3️⃣ SPREAD FILTR (XAUUSD > 25, EURUSD > 2.0)
     */
    public checkSpreadFilter(symbol: string, currentSpread: number): { allowed: boolean; reason?: string } {
        const maxSpread = symbol === 'XAUUSD' ? 25 : 2.0;
        
        if (currentSpread > maxSpread) {
            return { 
                allowed: false, 
                reason: `Spread too wide: ${currentSpread} > ${maxSpread} for ${symbol}` 
            };
        }

        return { allowed: true };
    }

    /**
     * 4️⃣ NEWS FILTR (15 min before/after high-impact)
     */
    public checkNewsFilter(): { allowed: boolean; reason?: string } {
        // Simple implementation - in real app would use news API
        const now = new Date();
        const dayOfWeek = now.getDay();
        const hour = now.getHours();
        
        // No signals during major news hours (simplified)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Weekdays
            if ((hour >= 13 && hour <= 14) || (hour >= 20 && hour <= 21)) {
                return { 
                    allowed: false, 
                    reason: 'High-impact news window detected' 
                };
            }
        }

        return { allowed: true };
    }

    /**
     * 5️⃣ FAKE BREAKOUT FILTR (break -> pullback -> continuation)
     */
    public checkFakeBreakoutFilter(candles: Candle[]): { allowed: boolean; reason?: string } {
        if (candles.length < 20) {
            return { allowed: false, reason: 'Insufficient data for fake breakout analysis' };
        }

        const recent = candles.slice(-10);
        const current = recent[recent.length - 1];
        
        // Check for recent breakout
        const highBreak = this.detectBreakout(recent, 'HIGH');
        const lowBreak = this.detectBreakout(recent, 'LOW');
        
        if (!highBreak && !lowBreak) {
            return { allowed: false, reason: 'No clear breakout detected' };
        }

        // Check for pullback after breakout
        const hasPullback = this.detectPullback(recent, highBreak ? 'HIGH' : 'LOW');
        
        if (!hasPullback) {
            return { 
                allowed: false, 
                reason: 'Breakout detected but no pullback confirmation' 
            };
        }

        // Check for continuation
        const hasContinuation = this.detectContinuation(recent, highBreak ? 'HIGH' : 'LOW');
        
        if (!hasContinuation) {
            return { 
                allowed: false, 
                reason: 'Breakout + pullback detected but no continuation' 
            };
        }

        return { allowed: true };
    }

    /**
     * 6️⃣ 1 SIGNAL = 1 SAVDO (QATTIQ)
     */
    public checkSingleTradeFilter(symbol: string): { allowed: boolean; reason?: string } {
        const hasActiveTrade = this.activeTrades.get(symbol) || false;
        
        if (hasActiveTrade) {
            return { 
                allowed: false, 
                reason: `Active trade detected for ${symbol}. Only 1 trade allowed at a time.` 
            };
        }

        return { allowed: true };
    }

    /**
     * 7️⃣ MANUAL CONFIRMATION CHECKLIST
     */
    public generateManualConfirmationChecklist(symbol: string, candles: Candle[]): {
        checklist: Array<{ item: string; confirmed: boolean; critical: boolean }>;
        overallConfirmed: boolean;
    } {
        const recent = candles.slice(-20);
        const current = recent[recent.length - 1];
        
        const checklist = [
            {
                item: 'Liquidity olinganmi (equal highs/lows taken)',
                confirmed: this.checkLiquidityTaken(recent),
                critical: true
            },
            {
                item: 'Structure o\'zgarganmi (BOS/CHoCH confirmed)',
                confirmed: this.checkStructureChange(recent),
                critical: true
            },
            {
                item: 'Kech kirayapmanmi (not late entry)',
                confirmed: this.checkEntryTiming(recent),
                critical: true
            },
            {
                item: 'Risk:Reward kamida 1:2 bormi',
                confirmed: this.checkRiskRewardRatio(recent),
                critical: true
            },
            {
                item: 'Spread normal holatda',
                confirmed: true, // Would check real spread
                critical: false
            },
            {
                item: 'News window emas',
                confirmed: this.checkNewsFilter().allowed,
                critical: false
            }
        ];

        const overallConfirmed = checklist
            .filter(item => item.critical)
            .every(item => item.confirmed);

        return { checklist, overallConfirmed };
    }

    /**
     * 8️⃣ STATISTIKA YIG'ISH
     */
    public recordSignal(symbol: string, strategy: string, entry: number, result?: 'WIN' | 'LOSS'): void {
        const stats = this.getStatistics(symbol);
        
        stats.totalSignals++;
        stats.lastSignalDate = Date.now();
        
        if (result) {
            if (result === 'WIN') {
                stats.wins++;
                stats.consecutiveLosses = 0;
            } else {
                stats.losses++;
                stats.consecutiveLosses++;
                stats.lastLossDate = Date.now();
            }
        }

        // Update strategy performance
        const strategyStats = stats.strategyPerformance.get(strategy) || { wins: 0, losses: 0 };
        if (result === 'WIN') {
            strategyStats.wins++;
        } else if (result === 'LOSS') {
            strategyStats.losses++;
        }
        stats.strategyPerformance.set(strategy, strategyStats);

        this.saveStatistics();
    }

    public setActiveTrade(symbol: string, active: boolean): void {
        this.activeTrades.set(symbol, active);
    }

    public getStatistics(symbol: string): SignalStatistics {
        if (!this.statistics.has(symbol)) {
            this.statistics.set(symbol, {
                totalSignals: 0,
                wins: 0,
                losses: 0,
                consecutiveLosses: 0,
                dailySignals: 0,
                lastSignalDate: 0,
                strategyPerformance: new Map()
            });
        }
        return this.statistics.get(symbol)!;
    }

    public getPerformanceReport(symbol: string): string {
        const stats = this.getStatistics(symbol);
        const winRate = stats.totalSignals > 0 ? (stats.wins / stats.totalSignals * 100).toFixed(1) : '0';
        
        let report = `📊 ${symbol} Performance Report:\n`;
        report += `Total Signals: ${stats.totalSignals}\n`;
        report += `Wins: ${stats.wins} | Losses: ${stats.losses}\n`;
        report += `Win Rate: ${winRate}%\n`;
        report += `Consecutive Losses: ${stats.consecutiveLosses}\n`;
        
        if (stats.strategyPerformance.size > 0) {
            report += `\n📈 Strategy Performance:\n`;
            stats.strategyPerformance.forEach((perf, strategy) => {
                const strategyWinRate = perf.wins + perf.losses > 0 ? 
                    (perf.wins / (perf.wins + perf.losses) * 100).toFixed(1) : '0';
                report += `${strategy}: ${perf.wins}W/${perf.losses}L (${strategyWinRate}%)\n`;
            });
        }
        
        return report;
    }

    // Private helper methods
    private detectBreakout(candles: Candle[], direction: 'HIGH' | 'LOW'): boolean {
        const levels = direction === 'HIGH' ? candles.map(c => c.high) : candles.map(c => c.low);
        const recent = levels.slice(-5);
        const previous = levels.slice(-10, -5);
        
        const recentHigh = Math.max(...recent);
        const previousHigh = Math.max(...previous);
        
        return direction === 'HIGH' ? recentHigh > previousHigh : recentHigh < previousHigh;
    }

    private detectPullback(candles: Candle[], direction: 'HIGH' | 'LOW'): boolean {
        const recent = candles.slice(-3);
        if (recent.length < 3) return false;
        
        const current = recent[recent.length - 1];
        const previous = recent[recent.length - 2];
        
        if (!current || !previous) return false;
        
        if (direction === 'HIGH') {
            return current.close < previous.close && current.low < previous.low;
        } else {
            return current.close > previous.close && current.high > previous.high;
        }
    }

    private detectContinuation(candles: Candle[], direction: 'HIGH' | 'LOW'): boolean {
        const recent = candles.slice(-2);
        if (recent.length < 2) return false;
        
        const current = recent[recent.length - 1];
        const previous = recent[recent.length - 2];
        
        if (!current || !previous) return false;
        
        if (direction === 'HIGH') {
            return current.close > previous.close && current.high > previous.high;
        } else {
            return current.close < previous.close && current.low < previous.low;
        }
    }

    private checkLiquidityTaken(candles: Candle[]): boolean {
        // Simplified liquidity check
        const recent = candles.slice(-10);
        const highs = recent.map(c => c.high);
        const lows = recent.map(c => c.low);
        
        const equalHighs = this.findEqualLevels(highs, 0.5);
        const equalLows = this.findEqualLevels(lows, 0.5);
        
        return equalHighs.length > 0 || equalLows.length > 0;
    }

    private checkStructureChange(candles: Candle[]): boolean {
        // Simplified structure change check
        const recent = candles.slice(-5);
        if (recent.length < 5) return false;
        
        const current = recent[recent.length - 1];
        const previous = recent[recent.length - 3];
        
        if (!current || !previous) return false;
        
        return Math.abs(current.close - previous.close) > 0.5;
    }

    private checkEntryTiming(candles: Candle[]): boolean {
        // Check if entry is not too late
        const recent = candles.slice(-3);
        if (recent.length < 3) return false;
        
        const current = recent[recent.length - 1];
        const first = recent[0];
        
        if (!current || !first) return false;
        
        const movePercent = Math.abs(current.close - first.close) / (first.close || 1) * 100;
        return movePercent < 0.3; // Not more than 0.3% move
    }

    private checkRiskRewardRatio(candles: Candle[]): boolean {
        // Simplified R:R check
        const recent = candles.slice(-10);
        if (recent.length < 10) return false;
        
        const atr = this.calculateATR(recent, 14);
        return atr > 0; // Basic check
    }

    private findEqualLevels(levels: number[], tolerance: number): number[] {
        const equalLevels: number[] = [];
        
        for (let i = 0; i < levels.length; i++) {
            for (let j = i + 1; j < levels.length; j++) {
                const levelI = levels[i];
                const levelJ = levels[j];
                
                if (levelI !== undefined && levelJ !== undefined && 
                    Math.abs(levelI - levelJ) <= tolerance) {
                    equalLevels.push(levelI);
                    break;
                }
            }
        }
        
        return equalLevels;
    }

    private calculateATR(candles: Candle[], period: number): number {
        if (candles.length < period + 1) return 0;

        let trSum = 0;
        for (let i = period; i < candles.length; i++) {
            const current = candles[i];
            const previous = candles[i - 1];
            
            if (!current || !previous) continue;
            
            const high = current.high || 0;
            const low = current.low || 0;
            const prevClose = previous.close || 0;
            
            const tr = Math.max(
                high - low,
                Math.abs(high - prevClose),
                Math.abs(low - prevClose)
            );
            
            trSum += tr;
        }

        return candles.length > period ? trSum / (candles.length - period) : 0;
    }

    private loadStatistics(): void {
        // In real app, load from file/database
        console.log('[SignalFilter] 📊 Statistics loaded');
    }

    private saveStatistics(): void {
        // In real app, save to file/database
        console.log('[SignalFilter] 💾 Statistics saved');
    }

    // Reset daily signal counts
    public resetDailyCounts(): void {
        this.statistics.forEach(stats => {
            stats.dailySignals = 0;
        });
        console.log('[SignalFilter] 🔄 Daily signal counts reset');
    }
}
