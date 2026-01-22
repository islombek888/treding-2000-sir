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
    chart?: Buffer | undefined;
    timeframe: string;
    macro?: {
        trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
        target: number;
        duration: string;
    } | undefined;
}


export class AlertService {
    private static instance: AlertService | null = null;
    private bot: TelegramBot | null = null;
    private subscribers: Map<number, string> = new Map(); // chatId -> preference
    private subscribersFilePath = path.resolve(process.cwd(), 'subscribers.json');

    // Button Labels
    private BUTTONS = {
    
        TF_5M: '⏱️ 5m Focus',
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
                
                if (text === this.BUTTONS.TF_5M) {
                    this.subscribers.set(chatId, '5m');
                    this.bot?.sendMessage(chatId, "✅ Sozlandi: Faqat *5 minutlik* standart signallar yuboriladi.", { parse_mode: 'Markdown' });
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
                    [ { text: this.BUTTONS.TF_5M } ],
                    
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

        // Dynamic SL/TP calculation (Same as chart)
        // If SL/TP not provided in signal, calculate standard
        const slMult = 1.6;
        const rewardRisk = 2.0;

        const sl = isBuy ? signal.price - (signal.atr * slMult) : signal.price + (signal.atr * slMult);

        // TP Levels - STRICT MASTER PROMPT REQUIREMENT
        const risk = Math.abs(signal.price - sl);
        const tp1 = isBuy ? signal.price + risk : signal.price - risk; // 1:1
        const tp2 = isBuy ? signal.price + (risk * 2) : signal.price - (risk * 2); // 1:2
        const tp3 = isBuy ? signal.price + (risk * 3) : signal.price - (risk * 3); // 1:3

        // Visual Signal Card - STRICT FORMAT
        const message = `
SYMBOL: ${signal.symbol}
TIMEFRAME: ${signal.timeframe}
DIRECTION: ${signal.direction}
ENTRY: ${signal.price.toFixed(digits)}
STOP LOSS: ${sl.toFixed(digits)}
TAKE PROFIT: ${tp1.toFixed(digits)}, ${tp2.toFixed(digits)}, ${tp3.toFixed(digits)}
EXPECTED MOVE: ${signal.pips} pips
CONFIDENCE: ${signal.confidence}%
STRATEGY NAME: ${signal.strategy}

⚠️ *Institutional Note:* High volatility detected. Immediate execution recommended.
        `;

        if (this.bot && this.subscribers.size > 0) {
            for (const [chatId, pref] of this.subscribers.entries()) {
                const userPref = pref.toLowerCase();
                const signalTF = signal.timeframe.toLowerCase();
                const timeframes = ['1m', '5m', '15m', '1h'];
                const isTfFiltering = timeframes.includes(userPref);

                if (isTfFiltering && userPref !== signalTF) {
                    continue;
                }

                try {
                    // Always send chart if available
                    if (signal.chart) {
                        await this.bot.sendPhoto(chatId, signal.chart, {
                            caption: message,
                            parse_mode: 'Markdown' // Can use Markdown for bolding if needed, but plain text requested mainly
                        });
                    } else {
                        await this.bot.sendMessage(chatId, message);
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
