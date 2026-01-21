import { MarketDataService } from './marketDataService.js';
export declare class VisualAlertService {
    private visualAnalyzer;
    private alertService;
    private lastAnalysisTime;
    private analysisInterval;
    constructor(marketDataService: MarketDataService);
    analyzeAndVisualize(): Promise<void>;
    private sendVisualSignal;
    getLatestChart(): string | null;
}
//# sourceMappingURL=visualAlertService.d.ts.map