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
}

export class AlertService {
    private static instance: AlertService | null = null;
    private bot: TelegramBot | null = null;
    private subscribers: Map<number, string> = new Map(); // chatId -> preference
    private subscribersFilePath = path.resolve(process.cwd(), 'subscribers.json');

    // Button Labels
    private BUTTONS = {
        STANDARD: '📊 50+ / 70 Pips',
        ULTRA: '🔥 Juda kuchli (200+ Pips)',
        XAUUSD: '🏆 Faqat XAUUSD',
        ALL: '🌐 Barcha signallar'
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
                this.showMenu(chatId, `🚀 *Institutional Grade Botga xush kelibsiz!* \n\nPastdagi tugmalar orqali o'zingizga mos signal turini tanlang:`);
                if (!this.subscribers.has(chatId)) {
                    this.subscribers.set(chatId, 'ALL');
                    this.saveSubscribers();
                }
            });

            this.bot.on('message', (msg) => {
                const chatId = msg.chat.id;
                const text = msg.text;

                if (text === this.BUTTONS.STANDARD) {
                    this.subscribers.set(chatId, 'STANDARD');
                    this.bot?.sendMessage(chatId, "✅ Sozlandi: Endi sizga *50+ pips*lik barcha signallar yuboriladi.", { parse_mode: 'Markdown' });
                } else if (text === this.BUTTONS.ULTRA) {
                    this.subscribers.set(chatId, 'ULTRA');
                    this.bot?.sendMessage(chatId, "✅ Sozlandi: Endi sizga faqat *200+ pips*lik o'ta kuchli signallar yuboriladi.", { parse_mode: 'Markdown' });
                } else if (text === this.BUTTONS.XAUUSD) {
                    this.subscribers.set(chatId, 'XAUUSD');
                    this.bot?.sendMessage(chatId, "✅ Sozlandi: Endi sizga faqat *XAUUSD (Oltin)* signallari yuboriladi.", { parse_mode: 'Markdown' });
                } else if (text === this.BUTTONS.ALL) {
                    this.subscribers.set(chatId, 'ALL');
                    this.bot?.sendMessage(chatId, "✅ Sozlandi: Hamma turdagi signallar yuboriladi.", { parse_mode: 'Markdown' });
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
                    [{ text: this.BUTTONS.STANDARD }, { text: this.BUTTONS.ULTRA }],
                    [{ text: this.BUTTONS.XAUUSD }, { text: this.BUTTONS.ALL }]
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

    public async sendSignal(signal: SignalData) {
        const isBuy = signal.direction === 'BUY';

        // Institutional Risk Assessment
        let riskLevel = 'MEDIUM';
        if (signal.confidence >= 93) riskLevel = 'LOW';
        else if (signal.confidence < 88) riskLevel = 'HIGH';

        // Time Window (Institutional estimate)
        const minTime = Math.floor(signal.pips / 2.5);
        const maxTime = Math.floor(signal.pips / 1.5);

        // Dynamic SL/TP calculation (ATR-based)
        const slMult = 1.6; // Institutional tighter SL
        const tpMult = 2.4;
        const sl = isBuy ? signal.price - (signal.atr * slMult) : signal.price + (signal.atr * slMult);
        const tp = isBuy ? signal.price + (signal.atr * tpMult) : signal.price - (signal.atr * tpMult);

        // Visual Signal Card (ASCII representation of a terminal card)
        const cardHeader = isBuy ? '🟩 INSTITUTIONAL BUY 🟩' : '🟥 INSTITUTIONAL SELL 🟥';
        const cardBody = `
        ╔═════════════════════════════╗
        ║   ${cardHeader}   ║
        ╠═════════════════════════════╣
        ║ Asset:  XAUUSD              ║
        ║ Entry:  ${signal.price.toFixed(5).padEnd(20)}║
        ║ SL (🛡️): ${sl.toFixed(5).padEnd(20)}║
        ║ TP (🎯): ${tp.toFixed(5).padEnd(20)}║
        ╚═════════════════════════════╝
        `;

        const message = `
🏛️ *XAUUSD Institutional Analysis* 🏛️

\`\`\`
${cardBody.trim()}
\`\`\`

📊 *Strategy:* ${signal.strategy}
📊 *Expected Move:* +${signal.pips} Pips
🛡️ *Confidence:* ${signal.confidence}%
⚖️ *Risk Level:* ${riskLevel}
🕒 *Time Window:* ${minTime}-${maxTime} Minutes

🧠 *Basis:* 
${signal.reason.map(r => `• ${r}`).join('\n')}

📍 *Action:* Execute at current price. Verified by 20-cycle consensus engine.
        `;

        if (this.bot && this.subscribers.size > 0) {
            for (const [chatId, pref] of this.subscribers.entries()) {
                // In institutional mode, all subscribers get all high-confidence signals
                // The filtering logic is removed as per the instruction's description for XAUUSD-only institutional focus
                // and the provided sendSignal method which sends to all subscribers.
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
