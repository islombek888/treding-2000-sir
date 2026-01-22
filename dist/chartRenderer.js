import { createCanvas } from 'canvas';
import {} from './marketDataService.js';
export class ChartRenderer {
    width = 1000;
    height = 600;
    padding = 60;
    priceColumnWidth = 80;
    async render(symbol, candles, projected, annotations) {
        const canvas = createCanvas(this.width, this.height);
        const ctx = canvas.getContext('2d');
        // 1. Background (Dark Theme)
        ctx.fillStyle = '#0b0e14';
        ctx.fillRect(0, 0, this.width, this.height);
        if (candles.length === 0)
            return canvas.toBuffer('image/png');
        // 2. Scaling
        const visibleCandles = candles.slice(-12);
        const minPrice = Math.min(...visibleCandles.map(c => c.low)) * 0.9998;
        const maxPrice = Math.max(...visibleCandles.map(c => c.high)) * 1.0002;
        const priceRange = maxPrice - minPrice;
        const getY = (price) => this.height - this.padding - ((price - minPrice) / priceRange) * (this.height - 2 * this.padding);
        const chartWidth = this.width - this.padding - this.priceColumnWidth;
        const candleWidth = chartWidth / visibleCandles.length;
        const getX = (index) => this.padding + index * candleWidth + candleWidth / 2;
        // 3. Grid Lines & Price Labels
        ctx.strokeStyle = '#1e222d';
        ctx.lineWidth = 1;
        ctx.font = '12px "Inter", Arial';
        ctx.fillStyle = '#787b86';
        for (let i = 0; i <= 5; i++) {
            const y = this.padding + (i * (this.height - 2 * this.padding)) / 5;
            const price = maxPrice - (i * priceRange) / 5;
            ctx.beginPath();
            ctx.moveTo(this.padding, y);
            ctx.lineTo(this.width - this.priceColumnWidth, y);
            ctx.stroke();
            ctx.fillText(price.toFixed(symbol === 'EURUSD' ? 5 : 2), this.width - this.priceColumnWidth + 5, y + 4);
        }
        // 4. Timeframe / Symbol Header
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`${symbol} 5M`, this.padding, this.padding - 20);
        ctx.font = '14px Arial';
        ctx.fillStyle = '#2962ff';
        ctx.fillText('INSTITUTIONAL PRECISION ENGINE', this.padding, this.padding - 45);
        // 5. Professional Candles (Solid and Precise)
        visibleCandles.forEach((c, i) => {
            const x = getX(i);
            const isUp = c.close >= c.open;
            const color = isUp ? '#089981' : '#f23645';
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = 1;
            // Wick
            ctx.beginPath();
            ctx.moveTo(x, getY(c.high));
            ctx.lineTo(x, getY(c.low));
            ctx.stroke();
            // Body
            const bodyTop = getY(Math.max(c.open, c.close));
            const bodyBottom = getY(Math.min(c.open, c.close));
            const bodyHeight = Math.max(1, bodyBottom - bodyTop);
            ctx.fillRect(x - candleWidth * 0.35, bodyTop, candleWidth * 0.7, bodyHeight);
        });
        // 6. Annotations (BOS)
        if (annotations) {
            if (annotations.bos) {
                const y = getY(annotations.bos.price);
                ctx.setLineDash([5, 5]);
                ctx.strokeStyle = '#2962ff';
                ctx.beginPath();
                ctx.moveTo(this.padding, y);
                ctx.lineTo(this.width - this.priceColumnWidth, y);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#2962ff';
                ctx.font = 'bold 12px Arial';
                ctx.fillText(`BOS (${annotations.bos.type})`, this.padding + 10, y - 5);
            }
        }
        // 7. Projected Move (TP/SL/Entry) with Arrow
        if (projected) {
            const entryY = getY(projected.entry);
            const slY = getY(projected.sl);
            const tpY = getY(projected.tp);
            const isBuy = projected.direction === 'BUY';
            const lastCandleX = getX(visibleCandles.length - 1);
            // Entry Line
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(this.padding, entryY);
            ctx.lineTo(this.width - this.priceColumnWidth, entryY);
            ctx.stroke();
            ctx.setLineDash([]);
            // Fill Zones
            ctx.fillStyle = isBuy ? 'rgba(8, 153, 129, 0.1)' : 'rgba(242, 54, 69, 0.1)';
            ctx.fillRect(this.padding, isBuy ? tpY : entryY, chartWidth, Math.abs(tpY - entryY));
            ctx.fillStyle = isBuy ? 'rgba(242, 54, 69, 0.1)' : 'rgba(8, 153, 129, 0.1)';
            ctx.fillRect(this.padding, isBuy ? entryY : slY, chartWidth, Math.abs(slY - entryY));
            // PROJECTION ARROW
            ctx.strokeStyle = isBuy ? '#089981' : '#f23645';
            ctx.lineWidth = 4;
            this.drawArrow(ctx, lastCandleX, entryY, lastCandleX + 50, isBuy ? tpY : tpY);
            // Labels
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = '#089981';
            ctx.fillText(`🎯 TP: ${projected.tp.toFixed(symbol === 'EURUSD' ? 5 : 2)}`, this.width - 250, tpY + (isBuy ? -10 : 20));
            ctx.fillStyle = '#f23645';
            ctx.fillText(`🛡️ SL: ${projected.sl.toFixed(symbol === 'EURUSD' ? 5 : 2)}`, this.width - 250, slY + (isBuy ? 20 : -10));
            // Large Direction Banner
            ctx.fillStyle = isBuy ? '#089981' : '#f23645';
            ctx.fillRect(this.width - 200, 20, 180, 50);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(isBuy ? 'BUY' : 'SELL', this.width - 110, 55);
            ctx.textAlign = 'left';
        }
        return canvas.toBuffer('image/png');
    }
    drawArrow(ctx, fromx, fromy, tox, toy) {
        const headlen = 20;
        const dx = tox - fromx;
        const dy = toy - fromy;
        const angle = Math.atan2(dy, dx);
        ctx.beginPath();
        ctx.moveTo(fromx, fromy);
        ctx.lineTo(tox, toy);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle / 6));
        ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
    }
}
//# sourceMappingURL=chartRenderer.js.map