import { createCanvas, type CanvasRenderingContext2D } from 'canvas';
import { type Candle } from './marketDataService.js';

export interface ChartProjectedMove {
    entry: number;
    sl: number;
    tp: number;
    direction: 'BUY' | 'SELL';
}

export interface ChartAnnotations {
    bos?: { price: number; type: 'BULLISH' | 'BEARISH' };
    liquidity?: { price: number; type: 'HIGH' | 'LOW' };
    zones?: { top: number; bottom: number; label: string }[];
}

export class ChartRenderer {
    private width = 1200;
    private height = 800;
    private padding = 50;

    public async render(
        symbol: string,
        candles: Candle[],
        projected?: ChartProjectedMove,
        annotations?: ChartAnnotations
    ): Promise<Buffer> {
        const canvas = createCanvas(this.width, this.height);
        const ctx = canvas.getContext('2d') as any as CanvasRenderingContext2D;

        // 1. Background
        ctx.fillStyle = '#131722';
        ctx.fillRect(0, 0, this.width, this.height);

        if (candles.length === 0) return canvas.toBuffer('image/png');

        // 2. Scaling
        const prices = candles.map(c => c.close);
        const minPrice = Math.min(...candles.map(c => c.low)) * 0.9995;
        const maxPrice = Math.max(...candles.map(c => c.high)) * 1.0005;
        const priceRange = maxPrice - minPrice;

        const getY = (price: number) =>
            this.height - this.padding - ((price - minPrice) / priceRange) * (this.height - 2 * this.padding);

        const candleWidth = (this.width - 2 * this.padding) / candles.length;
        const getX = (index: number) => this.padding + index * candleWidth + candleWidth / 2;

        // 3. Grid
        ctx.strokeStyle = '#2b2b2b';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const y = this.padding + (i * (this.height - 2 * this.padding)) / 4;
            ctx.beginPath();
            ctx.moveTo(this.padding, y);
            ctx.lineTo(this.width - this.padding, y);
            ctx.stroke();
        }

        // 4. Candles
        candles.forEach((c, i) => {
            const x = getX(i);
            const isUp = c.close >= c.open;
            ctx.strokeStyle = isUp ? '#26a69a' : '#ef5350';
            ctx.fillStyle = isUp ? '#26a69a' : '#ef5350';
            ctx.lineWidth = 1;

            // Wick
            ctx.beginPath();
            ctx.moveTo(x, getY(c.high));
            ctx.lineTo(x, getY(c.low));
            ctx.stroke();

            // Body
            const bodyTop = getY(Math.max(c.open, c.close));
            const bodyBottom = getY(Math.min(c.open, c.close));
            ctx.fillRect(x - candleWidth * 0.35, bodyTop, candleWidth * 0.7, Math.max(1, bodyBottom - bodyTop));
        });

        // 5. Annotations
        if (annotations) {
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = '#d1d4dc';

            if (annotations.bos) {
                const y = getY(annotations.bos.price);
                ctx.strokeStyle = '#bbbbbb';
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(this.padding, y);
                ctx.lineTo(this.width - this.padding, y);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillText(`BOS (${annotations.bos.type})`, this.padding + 10, y - 10);
            }

            annotations.zones?.forEach(z => {
                const top = getY(z.top);
                const bottom = getY(z.bottom);
                ctx.fillStyle = 'rgba(41, 98, 255, 0.1)';
                ctx.fillRect(this.padding, top, this.width - 2 * this.padding, bottom - top);
                ctx.fillStyle = '#2962ff';
                ctx.fillText(z.label, this.padding + 10, top + 20);
            });
        }

        // 6. Projected Move
        if (projected) {
            const entryY = getY(projected.entry);
            const slY = getY(projected.sl);
            const tpY = getY(projected.tp);

            // Entry Line
            ctx.strokeStyle = '#bbbbbb';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.padding, entryY);
            ctx.lineTo(this.width - this.padding, entryY);
            ctx.stroke();

            // TP Area
            ctx.fillStyle = 'rgba(38, 166, 154, 0.2)';
            if (projected.direction === 'BUY') ctx.fillRect(this.padding, tpY, this.width - 2 * this.padding, entryY - tpY);
            else ctx.fillRect(this.padding, entryY, this.width - 2 * this.padding, tpY - entryY);

            // SL Area
            ctx.fillStyle = 'rgba(239, 83, 80, 0.2)';
            if (projected.direction === 'BUY') ctx.fillRect(this.padding, entryY, this.width - 2 * this.padding, slY - entryY);
            else ctx.fillRect(this.padding, slY, this.width - 2 * this.padding, entryY - slY);

            // Projection Arrow
            ctx.strokeStyle = '#2962ff';
            ctx.lineWidth = 4;
            const startX = getX(candles.length - 1);
            ctx.beginPath();
            ctx.moveTo(startX, entryY);
            ctx.lineTo(startX + 100, tpY);
            ctx.stroke();
        }

        // 7. Header Info
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`${symbol} | ${projected?.direction || 'ANALYSIS'}`, this.padding, this.padding - 10);
        ctx.font = '14px Arial';
        ctx.fillStyle = '#d1d4dc';
        ctx.fillText('Institutional Precision Engine', this.padding, this.height - 20);

        return canvas.toBuffer('image/png');
    }
}
