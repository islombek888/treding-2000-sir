export interface ArchivedSignal {
    timestamp: number;
    symbol: string;
    direction: 'BUY' | 'SELL';
    entry: number;
    sl: number;
    tp: number;
    pips: number;
    confidence: number;
    strategy: string;
    result?: 'WIN' | 'LOSS' | 'PENDING';
    actualPips?: number;
}
export declare class SignalArchiveService {
    private filePath;
    archive(signal: ArchivedSignal): void;
    getHistory(): ArchivedSignal[];
    private saveHistory;
    updateResult(timestamp: number, result: 'WIN' | 'LOSS', actualPips: number): void;
}
//# sourceMappingURL=signalArchiveService.d.ts.map