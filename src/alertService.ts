import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

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


export class AlertService {
    private static instance: AlertService | null = null;
    private bot: TelegramBot | null = null;
    private subscribers: Map<number, string> = new Map(); // chatId -> preference
    private subscribersFilePath = path.resolve(process.cwd(), 'subscribers.json');

    // Button Labels
    private BUTTONS = {
        TF_1M: '⏱️ 1m Focus',
        TF_5M: '⏱️ 5m Focus',
        TF_15M: '⏱️ 15m Focus',
        ALL: '🌐 Hamma turdagi'
    };

    private constructor() {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        this.loadSubscribers();

        if (token) {
            this.bot = new TelegramBot(token, {
                polling: { interval: 1000, autoStart: true }
            });

            this.bot.on('polling_error', (error) => {
                if (error.message.includes('409 Conflict')) this.bot?.stopPolling();
            });

            this.bot.onText(/\/start/, (msg) => {
                const chatId = msg.chat.id;
                this.showMenu(chatId, `🚀 *Institutional Grade Botga xush kelibsiz!* \n\nPastdagi tugmalar orqali o'zingizga mos vaqt (timeframe) va signal turini tanlang:`);
                if (!this.subscribers.has(chatId)) {
                    this.subscribers.set(chatId, 'ALL');
                    this.saveSubscribers();
                }
            });

            this.bot.on('message', async (msg) => {
                const chatId = msg.chat.id;
                const text = msg.text;

                if (!text) return;

                if (text === '/status') {
                    // ... existing status logic
                    const subscriberCount = this.subscribers.size;
                    const uptime = Math.floor(process.uptime() / 60);
                    const pref = this.subscribers.get(chatId) || 'ALL';
                    const statusText = `🤖 *Bot holati:* Faol\n📈 *Sizning tanlovingiz:* ${pref}\n👥 *Jami obunachilar:* ${subscriberCount}\n🕒 *Ish vaqti:* ${uptime} minut\n🌐 *Ma'lumot manbasi:* Binance Real-time`;
                    this.bot?.sendMessage(chatId, statusText, { parse_mode: 'Markdown' });
                    return;
                }

                if (text === this.BUTTONS.TF_1M) {
                    this.subscribers.set(chatId, '1m');
                    this.bot?.sendMessage(chatId, "✅ Sozlandi: Faqat *1 minutlik* aniq va tezkor signallar yuboriladi.", { parse_mode: 'Markdown' });
                } else if (text === this.BUTTONS.TF_5M) {
                    this.subscribers.set(chatId, '5m');
                    this.bot?.sendMessage(chatId, "✅ Sozlandi: Faqat *5 minutlik* standart signallar yuboriladi.", { parse_mode: 'Markdown' });
                } else if (text === this.BUTTONS.TF_15M) {
                    this.subscribers.set(chatId, '15m');
                    this.bot?.sendMessage(chatId, "✅ Sozlandi: Faqat *15 minutlik* o'rta muddatli signallar yuboriladi.", { parse_mode: 'Markdown' });
                } else if (text === this.BUTTONS.ALL) {
                    this.subscribers.set(chatId, 'ALL');
                    this.bot?.sendMessage(chatId, "✅ Sozlandi: Hamma turdagi va hamma vaqtdagi signallar yuboriladi.", { parse_mode: 'Markdown' });
                }
                this.saveSubscribers();
            });
        }
    }

    private showMenu(chatId: number, text: string) {
        this.bot?.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            reply_markup: {
                keyboard: [
                    [{ text: this.BUTTONS.TF_1M }, { text: this.BUTTONS.TF_5M }, { text: this.BUTTONS.TF_15M }],
                    [{ text: this.BUTTONS.ALL }]
                ],
                resize_keyboard: true
            }
        });
    }

    public static getInstance(): AlertService {
        if (!AlertService.instance) AlertService.instance = new AlertService();
        return AlertService.instance;
    }

    private loadSubscribers() {
        try {
            if (fs.existsSync(this.subscribersFilePath)) {
                const data = fs.readFileSync(this.subscribersFilePath, 'utf-8');
                const obj = JSON.parse(data);
                this.subscribers = new Map(Object.entries(obj).map(([id, pref]) => [Number(id), String(pref)]));
            }
        } catch (error) {
            console.error("❌ Subscribers load error:", error);
        }
    }

    private saveSubscribers() {
        try {
            const obj = Object.fromEntries(this.subscribers);
            fs.writeFileSync(this.subscribersFilePath, JSON.stringify(obj, null, 2));
        } catch (error) {
            console.error("❌ Subscribers save error:", error);
        }
    }



    public sendClosureAlert(symbol: string, direction: string, price: number, reason: string) {
        const message = `
⚠️ *DIQQAT: POSITSIYANI YOPING* ⚠️

Aktiv: *${symbol}*
Holat: *${direction}* (Signal bekor qilindi)
Narx: ${price}
Sabab: ${reason}

📉 *Tavsiya:* Darhol bitimni yoping va yangi signal kuting.
`;
        this.broadcastMessage(message, symbol);
    }

    public sendTakeProfitAlert(symbol: string, price: number, pips: number) {
        const message = `
✅ *TAKE PROFIT (FOYDA)* ✅

Aktiv: *${symbol}*
Narx: ${price}
Sof Foyda: *+${pips} Pips*

💰 *Tavsiya:* Foydani oling va bozordan chiqing.
`;
        this.broadcastMessage(message, symbol);
    }

    private broadcastMessage(message: string, symbol: string) {
        this.subscribers.forEach((pref, chatId) => {
            if (pref === 'ALL' || pref === '1m') { // Simple broadcast for now
                this.bot?.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            }
        });
    }

    public async sendSignal(signal: SignalData) {
        const isBuy = signal.direction === 'BUY';
        const digits = signal.symbol === 'EURUSD' ? 5 : 2;

        // Institutional Risk Assessment
        let riskLevel = 'O\'RTA';
        if (signal.confidence >= 93) riskLevel = 'PAST';
        else if (signal.confidence < 88) riskLevel = 'YUQORI';

        // Dynamic Time Estimation based on ATR (Volatility)
        // High ATR (High Volume) -> Faster moves -> Shorter duration
        // Low ATR (Low Volume) -> Slower moves -> Longer duration

        let avgATR = 0.0001; // Default
        if (signal.symbol === 'XAUUSD') avgATR = 1.5; // Approx 1m avg
        else if (signal.symbol === 'EURUSD') avgATR = 0.00015;

        const volatilityRatio = signal.atr / avgATR;
        let speedFactor = 1.0;

        if (volatilityRatio > 1.5) speedFactor = 0.5; // Fast Market
        else if (volatilityRatio < 0.8) speedFactor = 1.5; // Slow Market

        let minTime = Math.max(2, Math.round(5 * speedFactor));
        let maxTime = Math.round(15 * speedFactor);

        // Clean timeframe string
        const tf = (signal.timeframe || '5m').replace(/[^a-z0-9]/gi, '').toLowerCase();

        if (tf === '1m') {
            minTime = Math.max(2, Math.round(3 * speedFactor));
            maxTime = Math.round(10 * speedFactor);
        } else if (tf === '15m') {
            minTime = Math.round(30 * speedFactor);
            maxTime = Math.round(90 * speedFactor);
        } else if (tf === '1h') {
            minTime = 60;
            maxTime = 240;
        }

        // Dynamic SL/TP calculation (Same as chart)
        const slMult = 1.6;
        const tpMult = 2.4;
        const sl = isBuy ? signal.price - (signal.atr * slMult) : signal.price + (signal.atr * slMult);
        const tp = isBuy ? signal.price + (signal.atr * tpMult) : signal.price - (signal.atr * tpMult);

        // Visual Signal Card
        const cardHeader = isBuy ? '🟩 INSTITUTIONAL BUY 🟩' : '🟥 INSTITUTIONAL SELL 🟥';
        const cardBody = `
        ╔═════════════════════════════╗
        ║   ${cardHeader}   ║
        ╠═════════════════════════════╣
        ║ Asset:  ${signal.symbol.padEnd(20)}║
        ║ Entry:  ${signal.price.toFixed(digits).padEnd(20)}║
        ║ SL (🛡️): ${sl.toFixed(digits).padEnd(20)}║
        ║ TP (🎯): ${tp.toFixed(digits).padEnd(20)}║
        ╚═════════════════════════════╝
        `;

        let timeLabel = "Kutilayotgan vaqt";
        if (tf === '1m') timeLabel = "⚡ Tezkor Natija (10 daqiqa ichida)";

        // Macro formatting
        let macroSection = "";
        if (signal.macro && signal.macro.trend !== 'NEUTRAL') {
            const trendIcon = signal.macro.trend === 'BULLISH' ? '🟢' : '🔴';
            macroSection = `
🌍 *Global Trend (1H):* ${trendIcon} ${signal.macro.trend}
🎯 *Asosiy Target:* ${signal.macro.target.toFixed(digits)}
⏳ *Bashorat:* ${signal.macro.duration}
`;
        }

        const message = `
🏛️ *${signal.symbol} Institutional Tahlil* 🏛️

\`\`\`
${cardBody.trim()}
\`\`\`

📊 *Strategiya:* ${signal.strategy}
📊 *Kutilayotgan harakat:* +${signal.pips} Pips
🛡️ *Ishonch:* ${signal.confidence}%
⚖️ *Xavf darajasi:* ${riskLevel}
🕒 *${timeLabel}:* ${minTime}-${maxTime} minut
${macroSection}
🧠 *Asos:* 
${signal.reason.map(r => `• ${r === 'Institutional Trend (EMA Multi-TF)' ? 'Trend yo\'nalishi (M5/M15)' :
            r === 'Break of Structure (BOS)' ? 'Struktura buzilishi (BOS)' :
                r === 'Volatility Expansion (ATR)' ? 'Volatillikning ortishi' : r}`).join('\n')}

📍 *Harakat:* Joriy narxdan kiring. 20-siklli tizim tomonidan tasdiqlangan.
        `;

        if (this.bot && this.subscribers.size > 0) {
            for (const [chatId, pref] of this.subscribers.entries()) {
                // Filtering: Only send if it matches subscriber's timeframe preference or if preference is 'ALL'
                const userPref = pref.toLowerCase();
                const signalTF = signal.timeframe.toLowerCase();

                // Special categories for STANDARD and ULTRA would need more logic, 
                // but let's focus on the timeframe buttons requested.
                // If userPref is one of the timeframes (1m, 5m, 15m), we filter.
                const timeframes = ['1m', '5m', '15m', '1h'];
                const isTfFiltering = timeframes.includes(userPref);

                if (isTfFiltering && userPref !== signalTF) {
                    continue;
                }

                try {
                    if (signal.chart) {
                        await this.bot.sendPhoto(chatId, signal.chart, {
                            caption: message,
                            parse_mode: 'Markdown'
                        });
                    } else {
                        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
                    }
                } catch (error: any) {
                    if (error.response?.statusCode === 403) {
                        this.subscribers.delete(chatId);
                        this.saveSubscribers();
                    }
                }
            }
        }
    }
}
