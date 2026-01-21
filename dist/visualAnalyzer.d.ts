import { MarketDataService } from './marketDataService.js';
export interface CandleData {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
export interface MarketStructure {
    type: 'bullish' | 'bearish' | 'neutral';
    highs: number[];
    lows: number[];
    bos?: {
        type: 'bullish_bos' | 'bearish_bos';
        level: number;
        candleIndex: number;
    } | undefined;
}
export interface KeyLevel {
    price: number;
    type: 'support' | 'resistance' | 'liquidity_high' | 'liquidity_low';
    strength: number;
    touches: number;
}
export interface TrendData {
    ema20: number[];
    ema50: number[];
    ema200: number[];
    direction: 'uptrend' | 'downtrend' | 'sideways';
    trendline?: {
        start: {
            x: number;
            y: number;
        };
        end: {
            x: number;
            y: number;
        };
        valid: boolean;
    };
}
export interface EntrySignal {
    direction: 'BUY' | 'SELL';
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    expectedPips: number;
    confidence: number;
    reason: string[];
    confirmation: string;
}
export declare class VisualAnalyzer {
    private marketDataService;
    private canvasWidth;
    private canvasHeight;
    private chartPadding;
    private candleWidth;
    private candleSpacing;
    constructor(marketDataService: MarketDataService);
    analyzeXAUUSD(): EntrySignal | null;
    generateChart(signal: EntrySignal): Promise<string>;
    private drawChartBackground;
    private drawGrid;
    private drawCandles;
    private drawEMAs;
    private drawEMA;
    private drawKeyLevels;
    private drawMarketStructure;
    private drawTrendline;
    private drawEntrySignal;
    private drawAnnotations;
    private calculatePriceRange;
    private analyzeMarketStructure;
    private identifyKeyLevels;
    private analyzeTrend;
    private calculateEMA;
    private generateEntrySignal;
    private getMainConfirmation;
}
//# sourceMappingURL=visualAnalyzer.d.ts.map