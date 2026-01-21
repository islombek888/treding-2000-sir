import { type Candle } from './marketDataService.js';
export interface ChartProjectedMove {
    entry: number;
    sl: number;
    tp: number;
    direction: 'BUY' | 'SELL';
}
export interface ChartAnnotations {
    bos?: {
        price: number;
        type: 'BULLISH' | 'BEARISH';
    };
    liquidity?: {
        price: number;
        type: 'HIGH' | 'LOW';
    };
    zones?: {
        top: number;
        bottom: number;
        label: string;
    }[];
}
export declare class ChartRenderer {
    private width;
    private height;
    private padding;
    render(symbol: string, candles: Candle[], projected?: ChartProjectedMove, annotations?: ChartAnnotations): Promise<Buffer>;
}
//# sourceMappingURL=chartRenderer.d.ts.map