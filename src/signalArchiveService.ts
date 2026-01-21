import fs from 'fs';
import path from 'path';

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

export class SignalArchiveService {
    private filePath = path.resolve(process.cwd(), 'signals_archive.json');

    public archive(signal: ArchivedSignal) {
        const history = this.getHistory();
        history.push(signal);
        this.saveHistory(history);
    }

    public getHistory(): ArchivedSignal[] {
        try {
            if (fs.existsSync(this.filePath)) {
                return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
            }
        } catch (e) {
            console.error("❌ History load error:", e);
        }
        return [];
    }

    private saveHistory(history: ArchivedSignal[]) {
        fs.writeFileSync(this.filePath, JSON.stringify(history, null, 2));
    }

    public updateResult(timestamp: number, result: 'WIN' | 'LOSS', actualPips: number) {
        const history = this.getHistory();
        const index = history.findIndex(s => s.timestamp === timestamp);
        if (index !== -1) {
            history[index]!.result = result;
            history[index]!.actualPips = actualPips;
            this.saveHistory(history);
        }
    }
}
