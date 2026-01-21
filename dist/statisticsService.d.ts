import { type ArchivedSignal } from './signalArchiveService.js';
export interface PerformanceStats {
    totalSignals: number;
    winRate: number;
    avgPips: number;
    maxDrawdown: number;
    strategyPerformance: Record<string, {
        winRate: number;
        total: number;
    }>;
}
export declare class StatisticsService {
    static calculate(history: ArchivedSignal[]): PerformanceStats;
}
//# sourceMappingURL=statisticsService.d.ts.map