import fs from 'fs';
import path from 'path';
export class SignalArchiveService {
    filePath = path.resolve(process.cwd(), 'signals_archive.json');
    archive(signal) {
        const history = this.getHistory();
        history.push(signal);
        this.saveHistory(history);
    }
    getHistory() {
        try {
            if (fs.existsSync(this.filePath)) {
                return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
            }
        }
        catch (e) {
            console.error("❌ History load error:", e);
        }
        return [];
    }
    saveHistory(history) {
        fs.writeFileSync(this.filePath, JSON.stringify(history, null, 2));
    }
    updateResult(timestamp, result, actualPips) {
        const history = this.getHistory();
        const index = history.findIndex(s => s.timestamp === timestamp);
        if (index !== -1) {
            history[index].result = result;
            history[index].actualPips = actualPips;
            this.saveHistory(history);
        }
    }
}
//# sourceMappingURL=signalArchiveService.js.map