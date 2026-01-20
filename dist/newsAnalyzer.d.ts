export declare class NewsAnalyzer {
    /**
     * In a real-world scenario, this would fetch from ForexFactory or similar API.
     * Here we simulate the presence of news based on current time.
     */
    static checkNewsRisk(): {
        status: 'SAFE' | 'RISKY' | 'BLOCK';
        events: string[];
    };
}
//# sourceMappingURL=newsAnalyzer.d.ts.map