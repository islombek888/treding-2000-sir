export interface SignalData {
    symbol: string;
    direction: string;
    price: number;
    pips: number;
    confidence: number;
    reason: string[];
}
export declare class AlertService {
    private bot;
    private subscribers;
    private subscribersFilePath;
    constructor();
    private loadSubscribers;
    private saveSubscribers;
    sendSignal(signal: SignalData): Promise<void>;
}
//# sourceMappingURL=alertService.d.ts.map