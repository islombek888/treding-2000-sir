import { type Candle } from './marketDataService.js';
export declare class StructureAnalyzer {
    static detectStructure(candles: Candle[]): {
        type: 'HH' | 'HL' | 'LH' | 'LL' | 'NONE';
        bos: boolean;
        sweep: boolean;
    };
}
//# sourceMappingURL=structureAnalyzer.d.ts.map