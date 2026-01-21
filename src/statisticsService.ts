import { type ArchivedSignal } from './signalArchiveService.js';

export interface PerformanceStats {
    totalSignals: number;
    winRate: number;
    avgPips: number;
    maxDrawdown: number;
    strategyPerformance: Record<string, { winRate: number; total: number }>;
}

export class StatisticsService {
    static calculate(history: ArchivedSignal[]): PerformanceStats {
        const finished = history.filter(s => s.result !== 'PENDING' && s.result !== undefined);
        const wins = finished.filter(s => s.result === 'WIN');

        const winRate = finished.length > 0 ? (wins.length / finished.length) * 100 : 0;
        const totalPips = finished.reduce((acc, s) => acc + (s.actualPips || 0), 0);
        const avgPips = finished.length > 0 ? totalPips / finished.length : 0;

        // Simplified max drawdown (pips)
        let maxDrawdown = 0;
        let currentDrawdown = 0;
        finished.forEach(s => {
            const pips = s.actualPips || 0;
            if (pips < 0) {
                currentDrawdown += Math.abs(pips);
                if (currentDrawdown > maxDrawdown) maxDrawdown = currentDrawdown;
            } else {
                currentDrawdown = 0;
            }
        });

        // Strategy Performance
        const strategies: Record<string, { wins: number; total: number }> = {};
        finished.forEach(s => {
            if (!strategies[s.strategy]) strategies[s.strategy] = { wins: 0, total: 0 };
            strategies[s.strategy]!.total++;
            if (s.result === 'WIN') strategies[s.strategy]!.wins++;
        });

        const strategyStats: Record<string, { winRate: number; total: number }> = {};
        Object.entries(strategies).forEach(([name, data]) => {
            strategyStats[name] = {
                winRate: (data.wins / data.total) * 100,
                total: data.total
            };
        });

        return {
            totalSignals: history.length,
            winRate,
            avgPips,
            maxDrawdown,
            strategyPerformance: strategyStats
        };
    }
}
