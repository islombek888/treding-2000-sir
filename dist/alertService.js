import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();
export class AlertService {
    bot = null;
    subscribers = new Set();
    subscribersFilePath = path.resolve(process.cwd(), 'subscribers.json');
    constructor() {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        this.loadSubscribers();
        if (token) {
            this.bot = new TelegramBot(token, { polling: true });
            console.log("🤖 Telegram Bot initialized.");
            this.bot.onText(/\/start/, (msg) => {
                const chatId = msg.chat.id;
                if (!this.subscribers.has(chatId)) {
                    this.subscribers.add(chatId);
                    this.saveSubscribers();
                    this.bot?.sendMessage(chatId, "🚀 XAUUSD PRO MAX Bot ishga tushdi! Endi sizga barcha yuqori ehtimolli signallar yuboriladi. 24/7 kuzatuv yoqildi.");
                }
                else {
                    this.bot?.sendMessage(chatId, "✅ Siz allaqachon obuna bo'lgansiz. Signallarni kuting!");
                }
            });
        }
        else {
            console.warn("⚠️ TELEGRAM_BOT_TOKEN topilmadi, xabarlar faqat konsolga chiqadi.");
        }
    }
    loadSubscribers() {
        try {
            if (fs.existsSync(this.subscribersFilePath)) {
                const data = fs.readFileSync(this.subscribersFilePath, 'utf-8');
                const list = JSON.parse(data);
                this.subscribers = new Set(list);
                console.log(`📊 Obunachilar yuklandi: ${this.subscribers.size} ta`);
            }
        }
        catch (error) {
            console.error("❌ Obunachilarni yuklashda xato:", error);
        }
    }
    saveSubscribers() {
        try {
            const list = Array.from(this.subscribers);
            fs.writeFileSync(this.subscribersFilePath, JSON.stringify(list, null, 2));
        }
        catch (error) {
            console.error("❌ Obunachilarni saqlashda xato:", error);
        }
    }
    async sendSignal(signal) {
        const message = `
🚨 *PRO MAX ${signal.symbol} SIGNAL* 💰

📍 *Direction:* ${signal.direction === 'BUY' ? '🟢 BUY' : '🔴 SELL'}
📊 *Entry Price:* ${signal.price.toFixed(5)}
📈 *Expected:* ${signal.pips} Pips
🛡️ *Confidence:* ${signal.confidence}%
🕒 *Window:* 10-25 Minutes

📝 *Reason:* 
${signal.reason.map(r => `• ${r}`).join('\n')}

⚠️ Accuracy > Frequency. Faqat 85%+ confluencelar ko'rsatiladi. 20+ pips kutilmoqda.
        `;
        console.log(message);
        if (this.bot && this.subscribers.size > 0) {
            for (const chatId of this.subscribers) {
                try {
                    await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
                }
                catch (error) {
                    if (error.response?.statusCode === 403) {
                        // User blocked the bot, remove them
                        this.subscribers.delete(chatId);
                        this.saveSubscribers();
                    }
                    console.error(`❌ ${chatId} ga yuborishda xato:`, error.message);
                }
            }
        }
    }
}
//# sourceMappingURL=alertService.js.map