import { MarketDataService } from './marketDataService.js';
import { createCanvas, registerFont, CanvasRenderingContext2D } from 'canvas';
import fs from 'fs';
import path from 'path';
export class VisualAnalyzer {
    marketDataService;
    canvasWidth = 1200;
    canvasHeight = 700;
    chartPadding = 60;
    candleWidth = 8;
    candleSpacing = 2;
    constructor(marketDataService) {
        this.marketDataService = marketDataService;
    }
    analyzeXAUUSD() {
        const candles = this.marketDataService.getCandles('XAUUSD', '1m');
        if (candles.length < 100)
            return null;
        // Analyze market structure
        const structure = this.analyzeMarketStructure(candles);
        // Identify key levels
        const keyLevels = this.identifyKeyLevels(candles);
        // Analyze trend
        const trend = this.analyzeTrend(candles);
        // Generate entry signal
        const signal = this.generateEntrySignal(candles, structure, keyLevels, trend);
        return signal && signal.expectedPips >= 50 && signal.confidence >= 70 ? signal : null;
    }
    async generateChart(signal) {
        const candles = this.marketDataService.getCandles('XAUUSD', '1m');
        const structure = this.analyzeMarketStructure(candles);
        const keyLevels = this.identifyKeyLevels(candles);
        const trend = this.analyzeTrend(candles);
        const canvas = createCanvas(this.canvasWidth, this.canvasHeight);
        const ctx = canvas.getContext('2d');
        // Setup chart background
        this.drawChartBackground(ctx);
        // Calculate price scale
        const priceRange = this.calculatePriceRange(candles);
        // Draw grid
        this.drawGrid(ctx, priceRange);
        // Draw candles
        this.drawCandles(ctx, candles, priceRange);
        // Draw EMAs
        this.drawEMAs(ctx, candles, priceRange, trend);
        // Draw key levels
        this.drawKeyLevels(ctx, keyLevels, priceRange);
        // Draw market structure
        this.drawMarketStructure(ctx, candles, structure, priceRange);
        // Draw trendline if valid
        if (trend.trendline?.valid) {
            this.drawTrendline(ctx, trend.trendline, priceRange);
        }
        // Draw entry signal
        this.drawEntrySignal(ctx, signal, candles, priceRange);
        // Draw annotations
        this.drawAnnotations(ctx, signal, structure, trend);
        // Save chart
        const chartPath = path.resolve(process.cwd(), 'xauusd_analysis.png');
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(chartPath, buffer);
        return chartPath;
    }
    drawChartBackground(ctx) {
        // TradingView-style dark background
        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        // Chart area background
        ctx.fillStyle = '#131722';
        ctx.fillRect(this.chartPadding, this.chartPadding, this.canvasWidth - 2 * this.chartPadding, this.canvasHeight - 2 * this.chartPadding);
    }
    drawGrid(ctx, priceRange) {
        ctx.strokeStyle = '#2a2e39';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        // Horizontal grid lines (price levels)
        const priceSteps = 10;
        for (let i = 0; i <= priceSteps; i++) {
            const y = this.chartPadding + (i / priceSteps) * (this.canvasHeight - 2 * this.chartPadding);
            ctx.beginPath();
            ctx.moveTo(this.chartPadding, y);
            ctx.lineTo(this.canvasWidth - this.chartPadding, y);
            ctx.stroke();
            // Price labels
            const price = priceRange.max - (i / priceSteps) * (priceRange.max - priceRange.min);
            ctx.fillStyle = '#848e9c';
            ctx.font = '11px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(price.toFixed(2), this.chartPadding - 5, y + 3);
        }
        // Vertical grid lines (time)
        const timeSteps = 20;
        for (let i = 0; i <= timeSteps; i++) {
            const x = this.chartPadding + (i / timeSteps) * (this.canvasWidth - 2 * this.chartPadding);
            ctx.beginPath();
            ctx.moveTo(x, this.chartPadding);
            ctx.lineTo(x, this.canvasHeight - this.chartPadding);
            ctx.stroke();
        }
        ctx.setLineDash([]);
    }
    drawCandles(ctx, candles, priceRange) {
        const chartWidth = this.canvasWidth - 2 * this.chartPadding;
        const chartHeight = this.canvasHeight - 2 * this.chartPadding;
        const visibleCandles = Math.min(100, candles.length);
        const startIndex = Math.max(0, candles.length - visibleCandles);
        for (let i = 0; i < visibleCandles; i++) {
            const candle = candles[startIndex + i];
            if (!candle)
                continue;
            const x = this.chartPadding + (i / visibleCandles) * chartWidth;
            const yOpen = this.chartPadding + ((priceRange.max - candle.open) / (priceRange.max - priceRange.min)) * chartHeight;
            const yClose = this.chartPadding + ((priceRange.max - candle.close) / (priceRange.max - priceRange.min)) * chartHeight;
            const yHigh = this.chartPadding + ((priceRange.max - candle.high) / (priceRange.max - priceRange.min)) * chartHeight;
            const yLow = this.chartPadding + ((priceRange.max - candle.low) / (priceRange.max - priceRange.min)) * chartHeight;
            // Candle color
            const isBullish = candle.close > candle.open;
            ctx.strokeStyle = isBullish ? '#26a69a' : '#ef5350';
            ctx.fillStyle = isBullish ? '#26a69a' : '#ef5350';
            // Draw wick
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, yHigh);
            ctx.lineTo(x, yLow);
            ctx.stroke();
            // Draw body
            const bodyHeight = Math.abs(yClose - yOpen);
            const bodyY = Math.min(yOpen, yClose);
            if (bodyHeight > 1) {
                ctx.fillRect(x - this.candleWidth / 2, bodyY, this.candleWidth, bodyHeight);
            }
            else {
                // Doji candle
                ctx.fillRect(x - this.candleWidth / 2, bodyY, this.candleWidth, 1);
            }
        }
    }
    drawEMAs(ctx, candles, priceRange, trend) {
        const chartWidth = this.canvasWidth - 2 * this.chartPadding;
        const chartHeight = this.canvasHeight - 2 * this.chartPadding;
        const visibleCandles = Math.min(100, candles.length);
        const startIndex = Math.max(0, candles.length - visibleCandles);
        // EMA 20
        this.drawEMA(ctx, trend.ema20.slice(-visibleCandles), '#2962ff', 2, startIndex, chartWidth, chartHeight, priceRange);
        // EMA 50
        this.drawEMA(ctx, trend.ema50.slice(-visibleCandles), '#00bcd4', 2, startIndex, chartWidth, chartHeight, priceRange);
        // EMA 200
        this.drawEMA(ctx, trend.ema200.slice(-visibleCandles), '#ff9800', 2, startIndex, chartWidth, chartHeight, priceRange);
    }
    drawEMA(ctx, emaData, color, width, startIndex, chartWidth, chartHeight, priceRange) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        for (let i = 0; i < emaData.length; i++) {
            const emaValue = emaData[i];
            if (!emaValue || emaValue === 0)
                continue;
            const x = this.chartPadding + (i / emaData.length) * chartWidth;
            const y = this.chartPadding + ((priceRange.max - emaValue) / (priceRange.max - priceRange.min)) * chartHeight;
            if (i === 0 || emaData[i - 1] === 0) {
                ctx.moveTo(x, y);
            }
            else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }
    drawKeyLevels(ctx, keyLevels, priceRange) {
        keyLevels.forEach(level => {
            const y = this.chartPadding + ((priceRange.max - level.price) / (priceRange.max - priceRange.min)) * (this.canvasHeight - 2 * this.chartPadding);
            // Set color based on type
            let color;
            let alpha;
            switch (level.type) {
                case 'support':
                    color = '#26a69a';
                    alpha = 0.3;
                    break;
                case 'resistance':
                    color = '#ef5350';
                    alpha = 0.3;
                    break;
                case 'liquidity_high':
                case 'liquidity_low':
                    color = '#ffc107';
                    alpha = 0.2;
                    break;
            }
            // Draw zone
            ctx.fillStyle = color + Math.round(alpha * 255).toString(16).padStart(2, '0');
            ctx.fillRect(this.chartPadding, y - 5, this.canvasWidth - 2 * this.chartPadding, 10);
            // Draw line
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(this.chartPadding, y);
            ctx.lineTo(this.canvasWidth - this.chartPadding, y);
            ctx.stroke();
        });
    }
    drawMarketStructure(ctx, candles, structure, priceRange) {
        if (structure.bos) {
            const bosCandle = candles[structure.bos.candleIndex];
            const y = this.chartPadding + ((priceRange.max - structure.bos.level) / (priceRange.max - priceRange.min)) * (this.canvasHeight - 2 * this.chartPadding);
            // Draw BOS line
            ctx.strokeStyle = structure.bos.type === 'bullish_bos' ? '#26a69a' : '#ef5350';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(this.chartPadding, y);
            ctx.lineTo(this.canvasWidth - this.chartPadding, y);
            ctx.stroke();
            ctx.setLineDash([]);
            // Label
            ctx.fillStyle = structure.bos.type === 'bullish_bos' ? '#26a69a' : '#ef5350';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('Break of Structure', this.chartPadding + 10, y - 10);
        }
    }
    drawTrendline(ctx, trendline, priceRange) {
        if (!trendline)
            return;
        const x1 = this.chartPadding + (trendline.start.x / 100) * (this.canvasWidth - 2 * this.chartPadding);
        const y1 = this.chartPadding + ((priceRange.max - trendline.start.y) / (priceRange.max - priceRange.min)) * (this.canvasHeight - 2 * this.chartPadding);
        const x2 = this.chartPadding + (trendline.end.x / 100) * (this.canvasWidth - 2 * this.chartPadding);
        const y2 = this.chartPadding + ((priceRange.max - trendline.end.y) / (priceRange.max - priceRange.min)) * (this.canvasHeight - 2 * this.chartPadding);
        ctx.strokeStyle = '#9c27b0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    drawEntrySignal(ctx, signal, candles, priceRange) {
        const chartWidth = this.canvasWidth - 2 * this.chartPadding;
        const chartHeight = this.canvasHeight - 2 * this.chartPadding;
        // Entry point (right side of chart)
        const entryX = this.canvasWidth - this.chartPadding - 50;
        const entryY = this.chartPadding + ((priceRange.max - signal.entryPrice) / (priceRange.max - priceRange.min)) * chartHeight;
        // SL
        const slY = this.chartPadding + ((priceRange.max - signal.stopLoss) / (priceRange.max - priceRange.min)) * chartHeight;
        // TP
        const tpY = this.chartPadding + ((priceRange.max - signal.takeProfit) / (priceRange.max - priceRange.min)) * chartHeight;
        // Draw entry point
        ctx.fillStyle = signal.direction === 'BUY' ? '#26a69a' : '#ef5350';
        ctx.beginPath();
        ctx.arc(entryX, entryY, 8, 0, 2 * Math.PI);
        ctx.fill();
        // Draw SL line
        ctx.strokeStyle = '#ff5252';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(entryX - 30, slY);
        ctx.lineTo(entryX + 30, slY);
        ctx.stroke();
        // Draw TP line
        ctx.strokeStyle = '#4caf50';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(entryX - 30, tpY);
        ctx.lineTo(entryX + 30, tpY);
        ctx.stroke();
        ctx.setLineDash([]);
        // Draw projection arrow
        const arrowLength = 100;
        const arrowY = signal.direction === 'BUY' ? tpY : slY;
        const arrowEndY = signal.direction === 'BUY' ? entryY - arrowLength : entryY + arrowLength;
        ctx.strokeStyle = signal.direction === 'BUY' ? '#4caf50' : '#ff5252';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(entryX, entryY);
        ctx.lineTo(entryX, arrowEndY);
        ctx.stroke();
        // Arrow head
        ctx.beginPath();
        if (signal.direction === 'BUY') {
            ctx.moveTo(entryX - 10, arrowEndY + 15);
            ctx.lineTo(entryX, arrowEndY);
            ctx.lineTo(entryX + 10, arrowEndY + 15);
        }
        else {
            ctx.moveTo(entryX - 10, arrowEndY - 15);
            ctx.lineTo(entryX, arrowEndY);
            ctx.lineTo(entryX + 10, arrowEndY - 15);
        }
        ctx.stroke();
        // Labels
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('ENTRY', entryX + 15, entryY + 3);
        ctx.fillText('SL', entryX + 15, slY + 3);
        ctx.fillText('TP', entryX + 15, tpY + 3);
        ctx.fillStyle = signal.direction === 'BUY' ? '#4caf50' : '#ff5252';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`${signal.expectedPips} PIPS`, entryX + 15, arrowEndY);
    }
    drawAnnotations(ctx, signal, structure, trend) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        // Title
        ctx.fillText('XAUUSD - VISUAL ANALYSIS', this.chartPadding, 30);
        // Signal info
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = signal.direction === 'BUY' ? '#26a69a' : '#ef5350';
        ctx.fillText(`${signal.direction} SIGNAL`, this.chartPadding, 55);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText(`Confidence: ${signal.confidence}%`, this.chartPadding + 150, 55);
        ctx.fillText(`Expected: ${signal.expectedPips} pips`, this.chartPadding + 280, 55);
        // Confirmation text
        ctx.fillStyle = '#ffc107';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(signal.confirmation, this.chartPadding, this.canvasHeight - 20);
        // Reasons
        ctx.fillStyle = '#848e9c';
        ctx.font = '11px Arial';
        let reasonY = this.canvasHeight - 40;
        signal.reason.slice(0, 3).forEach(reason => {
            ctx.fillText(`• ${reason}`, this.chartPadding, reasonY);
            reasonY += 15;
        });
    }
    calculatePriceRange(candles) {
        const visibleCandles = candles.slice(-100);
        const highs = visibleCandles.map(c => c.high);
        const lows = visibleCandles.map(c => c.low);
        const max = Math.max(...highs);
        const min = Math.min(...lows);
        const padding = (max - min) * 0.1;
        return {
            min: min - padding,
            max: max + padding
        };
    }
    analyzeMarketStructure(candles) {
        const highs = [];
        const lows = [];
        // Find swing highs and lows
        for (let i = 2; i < candles.length - 2; i++) {
            const current = candles[i];
            const prev1 = candles[i - 1];
            const prev2 = candles[i - 2];
            const next1 = candles[i + 1];
            const next2 = candles[i + 2];
            if (!current || !prev1 || !prev2 || !next1 || !next2)
                continue;
            // Swing high
            if (current.high > prev1.high && current.high > prev2.high &&
                current.high > next1.high && current.high > next2.high) {
                highs.push(current.high);
            }
            // Swing low
            if (current.low < prev1.low && current.low < prev2.low &&
                current.low < next1.low && current.low < next2.low) {
                lows.push(current.low);
            }
        }
        // Determine structure type
        let type = 'neutral';
        let bos;
        if (highs.length >= 2 && lows.length >= 2) {
            const lastHigh = highs[highs.length - 1];
            const prevHigh = highs[highs.length - 2];
            const lastLow = lows[lows.length - 1];
            const prevLow = lows[lows.length - 2];
            if (lastHigh && prevHigh && lastLow && prevLow) {
                const recentHH = lastHigh > prevHigh;
                const recentHL = lastLow > prevLow;
                if (recentHH && recentHL) {
                    type = 'bullish';
                    // Check for BOS
                    if (lows.length >= 3) {
                        const thirdLow = lows[lows.length - 3];
                        if (thirdLow && lastLow > thirdLow) {
                            bos = {
                                type: 'bullish_bos',
                                level: thirdLow,
                                candleIndex: Math.max(0, candles.length - 10)
                            };
                        }
                    }
                }
                else if (!recentHH && !recentHL) {
                    type = 'bearish';
                    // Check for BOS
                    if (highs.length >= 3) {
                        const thirdHigh = highs[highs.length - 3];
                        if (thirdHigh && lastHigh < thirdHigh) {
                            bos = {
                                type: 'bearish_bos',
                                level: thirdHigh,
                                candleIndex: Math.max(0, candles.length - 10)
                            };
                        }
                    }
                }
            }
        }
        return { type, highs, lows, bos };
    }
    identifyKeyLevels(candles) {
        const levels = [];
        const visibleCandles = candles.slice(-100);
        // Find significant price levels
        const priceTouches = new Map();
        visibleCandles.forEach(candle => {
            // Round prices to nearest 0.5 for XAUUSD
            const highLevel = Math.round(candle.high * 2) / 2;
            const lowLevel = Math.round(candle.low * 2) / 2;
            priceTouches.set(highLevel, (priceTouches.get(highLevel) || 0) + 1);
            priceTouches.set(lowLevel, (priceTouches.get(lowLevel) || 0) + 1);
        });
        // Filter for significant levels (3+ touches)
        priceTouches.forEach((touches, price) => {
            if (touches >= 3) {
                const recentCandles = visibleCandles.slice(-20);
                const avgPrice = recentCandles.reduce((sum, c) => sum + c.close, 0) / recentCandles.length;
                levels.push({
                    price,
                    type: price > avgPrice ? 'resistance' : 'support',
                    strength: touches,
                    touches
                });
            }
        });
        return levels.sort((a, b) => b.touches - a.touches).slice(0, 8);
    }
    analyzeTrend(candles) {
        const closes = candles.map(c => c.close);
        // Calculate EMAs
        const ema20 = this.calculateEMA(closes, 20);
        const ema50 = this.calculateEMA(closes, 50);
        const ema200 = this.calculateEMA(closes, 200);
        // Determine trend direction
        const last20 = ema20[ema20.length - 1] || 0;
        const last50 = ema50[ema50.length - 1] || 0;
        const last200 = ema200[ema200.length - 1] || 0;
        let direction = 'sideways';
        if (last20 > last50 && last50 > last200) {
            direction = 'uptrend';
        }
        else if (last20 < last50 && last50 < last200) {
            direction = 'downtrend';
        }
        return {
            ema20,
            ema50,
            ema200,
            direction
        };
    }
    calculateEMA(data, period) {
        const ema = [];
        const multiplier = 2 / (period + 1);
        // Start with SMA
        let sum = 0;
        for (let i = 0; i < period && i < data.length; i++) {
            sum += data[i] || 0;
        }
        const initialSMA = period > 0 ? sum / period : 0;
        if (period > 0 && period - 1 < ema.length) {
            ema[period - 1] = initialSMA;
        }
        // Calculate EMA
        for (let i = period; i < data.length; i++) {
            const currentEma = ema[i - 1];
            const currentData = data[i] || 0;
            if (currentEma !== undefined) {
                ema[i] = (currentData - currentEma) * multiplier + currentEma;
            }
        }
        return ema;
    }
    generateEntrySignal(candles, structure, keyLevels, trend) {
        const lastCandle = candles[candles.length - 1];
        if (!lastCandle)
            return null;
        const currentPrice = lastCandle.close;
        const recentCandles = candles.slice(-20);
        // Find confluence factors
        const confirmations = [];
        let confidence = 30; // Base confidence
        // Structure confirmation
        if (structure.type === 'bullish') {
            confirmations.push('Bullish Market Structure');
            confidence += 20;
        }
        else if (structure.type === 'bearish') {
            confirmations.push('Bearish Market Structure');
            confidence += 20;
        }
        // BOS confirmation
        if (structure.bos) {
            confirmations.push('Break of Structure Confirmed');
            confidence += 25;
        }
        // Trend confirmation
        if (trend.direction === 'uptrend') {
            confirmations.push('EMA Trend Alignment (Uptrend)');
            confidence += 15;
        }
        else if (trend.direction === 'downtrend') {
            confirmations.push('EMA Trend Alignment (Downtrend)');
            confidence += 15;
        }
        // Level confirmation
        const nearbyLevels = keyLevels.filter(level => Math.abs(level.price - currentPrice) < 2);
        if (nearbyLevels.length > 0) {
            confirmations.push('Key Level Interaction');
            confidence += 10;
        }
        // Momentum confirmation
        const firstCandle = recentCandles[0];
        const recentMove = firstCandle ? Math.abs(currentPrice - firstCandle.close) : 0;
        if (recentMove > 1.0) {
            confirmations.push('Momentum Buildup');
            confidence += 10;
        }
        // Always generate a signal for testing if confidence >= 70
        if (confidence >= 70) {
            let direction;
            let entryPrice = currentPrice;
            let stopLoss;
            let takeProfit;
            if (structure.type === 'bullish' || trend.direction === 'uptrend') {
                direction = 'BUY';
                stopLoss = currentPrice - 3.0;
                takeProfit = currentPrice + 5.0;
            }
            else {
                direction = 'SELL';
                stopLoss = currentPrice + 3.0;
                takeProfit = currentPrice - 5.0;
            }
            const expectedPips = Math.abs(takeProfit - entryPrice) * 100;
            return {
                direction,
                entryPrice,
                stopLoss,
                takeProfit,
                expectedPips: Math.round(expectedPips),
                confidence,
                reason: confirmations,
                confirmation: this.getMainConfirmation(structure, trend, nearbyLevels)
            };
        }
        return null;
    }
    getMainConfirmation(structure, trend, levels) {
        if (structure.bos)
            return 'Break of Structure Confirmed';
        if (trend.direction !== 'sideways')
            return 'Trend Continuation Expected';
        if (levels.length > 0)
            return 'Key Level Rejection';
        return 'Multiple Confluence Factors';
    }
}
//# sourceMappingURL=visualAnalyzer.js.map