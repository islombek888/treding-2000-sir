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
    private constructor();
    private showMenu;
    static getInstance(): AlertService;
    private loadSubscribers;
    private saveSubscribers;
    sendClosureAlert(symbol: string, direction: string, price: number, reason: string): void;
    sendTakeProfitAlert(symbol: string, price: number, pips: number): void;
    private broadcastMessage;
}
//# sourceMappingURL=alertService.d.ts.map