import { type Candle } from './marketDataService.js';
export interface SignalStatistics {
    totalSignals: number;
    wins: number;
    losses: number;
    consecutiveLosses: number;
    lastLossDate?: number;
    dailySignals: number;
    lastSignalDate: number;
    strategyPerformance: Map<string, {
        wins: number;
        losses: number;
    }>;
}
export interface SignalFilters {
    spreadFilter: boolean;
    newsFilter: boolean;
    fakeBreakoutFilter: boolean;
    dailyLimitFilter: boolean;
    consecutiveLossFilter: boolean;
    singleTradeFilter: boolean;
}
export declare class SignalFilterService {
    private statistics;
    private activeTrades;
    private dailySignalCounts;
    constructor();
    /**
     * 1️⃣ SIGNAL SONINI QATTIQ CHEKLASH (5-8 max per day)
     */
    checkDailyLimit(symbol: string): {
        allowed: boolean;
        reason?: string;
    };
    /**
     * 2️⃣ 24 SOAT TO'XTATISH (3 consecutive losses)
     */
    checkConsecutiveLosses(symbol: string): {
        allowed: boolean;
        reason?: string;
    };
    /**
     * 3️⃣ SPREAD FILTR (XAUUSD > 25, EURUSD > 2.0)
     */
    checkSpreadFilter(symbol: string, currentSpread: number): {
        allowed: boolean;
        reason?: string;
    };
    /**
     * 4️⃣ NEWS FILTR (15 min before/after high-impact)
     */
    checkNewsFilter(): {
        allowed: boolean;
        reason?: string;
    };
    /**
     * 5️⃣ FAKE BREAKOUT FILTR (break -> pullback -> continuation)
     */
    checkFakeBreakoutFilter(candles: Candle[]): {
        allowed: boolean;
        reason?: string;
    };
    /**
     * 6️⃣ 1 SIGNAL = 1 SAVDO (QATTIQ)
     */
    checkSingleTradeFilter(symbol: string): {
        allowed: boolean;
        reason?: string;
    };
    /**
     * 7️⃣ MANUAL CONFIRMATION CHECKLIST
     */
    generateManualConfirmationChecklist(symbol: string, candles: Candle[]): {
        checklist: Array<{
            item: string;
            confirmed: boolean;
            critical: boolean;
        }>;
        overallConfirmed: boolean;
    };
    /**
     * 8️⃣ STATISTIKA YIG'ISH
     */
    recordSignal(symbol: string, strategy: string, entry: number, result?: 'WIN' | 'LOSS'): void;
    setActiveTrade(symbol: string, active: boolean): void;
    getStatistics(symbol: string): SignalStatistics;
    getPerformanceReport(symbol: string): string;
    private detectBreakout;
    private detectPullback;
    private detectContinuation;
    private checkLiquidityTaken;
    private checkStructureChange;
    private checkEntryTiming;
    private checkRiskRewardRatio;
    private findEqualLevels;
    private calculateATR;
    private loadStatistics;
    private saveStatistics;
    resetDailyCounts(): void;
}
//# sourceMappingURL=signalFilterService.d.ts.map