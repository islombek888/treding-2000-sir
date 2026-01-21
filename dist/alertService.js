import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();
export class AlertService {
    static instance = null;
    bot = null;
    subscribers = new Map(); // chatId -> preference
    subscribersFilePath = path.resolve(process.cwd(), 'subscribers.json');
    // Button Labels
    BUTTONS = {
        STANDARD: '📊 50+ / 70 Pips',
        ULTRA: '🔥 Juda kuchli (200+ Pips)',
        XAUUSD: '🏆 Faqat XAUUSD',
        ALL: '🌐 Barcha signallar'
    };
    constructor() {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        this.loadSubscribers();
        if (token) {
            this.bot = new TelegramBot(token, {
                polling: { interval: 1000, autoStart: true }
            });
            this.bot.on('polling_error', (error) => {
                if (error.message.includes('409 Conflict'))
                    this.bot?.stopPolling();
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
                }
                else if (text === this.BUTTONS.ULTRA) {
                    this.subscribers.set(chatId, 'ULTRA');
                    this.bot?.sendMessage(chatId, "✅ Sozlandi: Endi sizga faqat *200+ pips*lik o'ta kuchli signallar yuboriladi.", { parse_mode: 'Markdown' });
                }
                else if (text === this.BUTTONS.XAUUSD) {
                    this.subscribers.set(chatId, 'XAUUSD');
                    this.bot?.sendMessage(chatId, "✅ Sozlandi: Endi sizga faqat *XAUUSD (Oltin)* signallari yuboriladi.", { parse_mode: 'Markdown' });
                }
                else if (text === this.BUTTONS.ALL) {
                    this.subscribers.set(chatId, 'ALL');
                    this.bot?.sendMessage(chatId, "✅ Sozlandi: Hamma turdagi signallar yuboriladi.", { parse_mode: 'Markdown' });
                }
                this.saveSubscribers();
            });
        }
    }
    showMenu(chatId, text) {
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
    static getInstance() {
        if (!AlertService.instance)
            AlertService.instance = new AlertService();
        return AlertService.instance;
    }
    loadSubscribers() {
        try {
            if (fs.existsSync(this.subscribersFilePath)) {
                const data = fs.readFileSync(this.subscribersFilePath, 'utf-8');
                const obj = JSON.parse(data);
                this.subscribers = new Map(Object.entries(obj).map(([id, pref]) => [Number(id), String(pref)]));
            }
        }
        catch (error) {
            console.error("❌ Subscribers load error:", error);
        }
    }
    saveSubscribers() {
        try {
            const obj = Object.fromEntries(this.subscribers);
            fs.writeFileSync(this.subscribersFilePath, JSON.stringify(obj, null, 2));
        }
        catch (error) {
            console.error("❌ Subscribers save error:", error);
        }
    }
    async sendSignal(signal) {
        const isBuy = signal.direction === 'BUY';
        const candleEmoji = isBuy ? '🟢' : '🔴';
        // Visual Candle Representation
        const visualCandle = isBuy
            ? `   ┃\n   ██\n   ██\n   ┃`
            : `   ┃\n   ██\n   ██\n   ┃`;
        const message = `
💎 *${signal.symbol} ULTRA SIGNAL* 🚀

${candleEmoji} *Yo'nalish:* ${isBuy ? 'SATIB OLISH (BUY)' : 'SOTISH (SELL)'}
${isBuy ? '🟢' : '🔴'}${visualCandle}

📊 *Kirish narxi:* ${signal.price.toFixed(5)}
📈 *Kutilayotgan harakat:* ${signal.pips} Pips
🛡️ *Ishonchlilik:* ${signal.confidence}%
🕒 *Kutilayotgan vaqt:* ${Math.floor(signal.pips / 2)} - ${signal.pips} Minut

📝 *Sabablar:* 
${signal.reason.map(r => `• ${r}`).join('\n')}

🛡️ Institutional Accuracy. 85%+ aniqlik.
        `;
        if (this.bot && this.subscribers.size > 0) {
            for (const [chatId, pref] of this.subscribers.entries()) {
                // Filter Logic
                let shouldSend = false;
                if (pref === 'ALL' && signal.pips >= 7)
                    shouldSend = true;
                else if (pref === 'XAUUSD' && signal.symbol === 'XAUUSD')
                    shouldSend = true;
                else if (pref === 'ULTRA' && signal.pips >= 200)
                    shouldSend = true;
                else if (pref === 'STANDARD' && signal.pips >= 50)
                    shouldSend = true;
                if (shouldSend) {
                    try {
                        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
                    }
                    catch (error) {
                        if (error.response?.statusCode === 403) {
                            this.subscribers.delete(chatId);
                            this.saveSubscribers();
                        }
                    }
                }
            }
        }
    }
}
//# sourceMappingURL=alertService.js.map