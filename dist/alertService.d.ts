export interface SignalData {
    symbol: string;
    direction: string;
    price: number;
    pips: number;
    confidence: number;
    reason: string[];
    atr: number;
    strategy: string;
    chart?: Buffer;
    timeframe: string;
    macro?: {
        trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
        target: number;
        duration: string;
    };
}
export declare class AlertService {
    private static instance;
    private bot;
    private subscribers;
    private subscribersFilePath;
    private BUTTONS;
    private analysisCallback;
    private userStates;
    setAnalysisCallback(callback: (symbol: string) => Promise<any>): void;
    private constructor();
    private runAnalysis;
    private showMenu;
    static getInstance(): AlertService;
    private loadSubscribers;
    private saveSubscribers;
    sendSignal(signal: SignalData): Promise<void>;
}
//# sourceMappingURL=alertService.d.ts.map