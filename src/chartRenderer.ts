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

        // 5. Annotations (Step 5 - On-Chart Explanation)
        if (annotations) {
            ctx.font = 'bold 12px Arial';
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

                // Label on line
                ctx.fillStyle = '#131722';
                ctx.fillRect(this.padding + 10, y - 10, 150, 20);
                ctx.fillStyle = '#bbbbbb';
                ctx.fillText(`BOS Confirmed Here (${annotations.bos.type})`, this.padding + 15, y + 5);
            }

            annotations.zones?.forEach(z => {
                const top = getY(z.top);
                const bottom = getY(z.bottom);
                ctx.fillStyle = 'rgba(41, 98, 255, 0.08)';
                ctx.fillRect(this.padding, top, this.width - 2 * this.padding, bottom - top);

                ctx.fillStyle = '#2962ff';
                ctx.fillText(z.label.toUpperCase(), this.padding + 15, top + 15);
            });
        }

        // 6. Projected Move & Strategy (Step 3 & 4)
        if (projected) {
            const entryY = getY(projected.entry);
            const slY = getY(projected.sl);
            const tpY = getY(projected.tp);

            // Entry Line
            ctx.strokeStyle = 'rgba(209, 212, 220, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.padding, entryY);
            ctx.lineTo(this.width - this.padding, entryY);
            ctx.stroke();
            ctx.fillStyle = '#d1d4dc';
            ctx.fillText("ENTRY ZONE", this.width - 150, entryY - 5);

            // TP Area
            ctx.fillStyle = 'rgba(38, 166, 154, 0.15)';
            if (projected.direction === 'BUY') ctx.fillRect(this.padding, tpY, this.width - 2 * this.padding, entryY - tpY);
            else ctx.fillRect(this.padding, entryY, this.width - 2 * this.padding, tpY - entryY);
            ctx.fillStyle = '#26a69a';
            ctx.fillText("TARGET LIQUIDITY (TP)", this.width - 180, tpY + 15);

            // SL Area
            ctx.fillStyle = 'rgba(239, 83, 80, 0.15)';
            if (projected.direction === 'BUY') ctx.fillRect(this.padding, entryY, this.width - 2 * this.padding, slY - entryY);
            else ctx.fillRect(this.padding, slY, this.width - 2 * this.padding, entryY - slY);
            ctx.fillStyle = '#ef5350';
            ctx.fillText("INVALIDATION LEVEL (SL)", this.width - 180, slY - 5);

            // Projection Arrow ( respecting structure)
            ctx.strokeStyle = '#2962ff';
            ctx.lineWidth = 3;
            const startX = getX(candles.length - 1);
            this.drawArrow(ctx, startX, entryY, startX + 120, tpY);
            ctx.fillStyle = '#2962ff';
            ctx.fillText("TREND CONTINUATION ZONE", startX + 20, (entryY + tpY) / 2);
        }

        // 7. Institutional Header
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px Arial';
        ctx.fillText(`XAUUSD INSTITUTIONAL ENGINE V4`, this.padding, this.padding - 15);
        ctx.font = '12px Arial';
        ctx.fillStyle = '#787b86';
        ctx.fillText('Analysis derived from TradingView sequence logic', this.padding, this.height - 15);

        return canvas.toBuffer('image/png');
    }

    private drawArrow(ctx: CanvasRenderingContext2D, fromx: number, fromy: number, tox: number, toy: number) {
        const headlen = 15;
        const dx = tox - fromx;
        const dy = toy - fromy;
        const angle = Math.atan2(dy, dx);
        ctx.beginPath();
        ctx.moveTo(fromx, fromy);
        ctx.lineTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    }
}
