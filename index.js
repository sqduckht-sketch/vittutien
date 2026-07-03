const { Client, GatewayIntentBits } = require('discord.js');
const { Pool } = require('pg');
const express = require('express');

// --- 1. WEB SERVER (BẮT BUỘC ĐỂ RENDER GIỮ BOT CHẠY) ---
const app = express();
app.get('/', (req, res) => res.send('Bot Tiên Hiệp đang online!'));
app.listen(process.env.PORT || 3000, () => console.log('🚀 Server started'));

// --- 2. CẤU HÌNH BOT & DATABASE ---
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

pool.query(`CREATE TABLE IF NOT EXISTS players (id VARCHAR(255) PRIMARY KEY, data JSONB)`);

const realms = ["Luyện Khí", "Trúc Cơ", "Kết Đan", "Nguyên Anh", "Hóa Thần", "Luyện Hư", "Hợp Thể", "Độ Kiếp", "Đại Thừa"];
const ADMIN_ID = '1126092277220122634';

// Các hàm hỗ trợ
async function getP(id) { const res = await pool.query('SELECT data FROM players WHERE id = $1', [id]); return res.rows.length > 0 ? res.rows[0].data : null; }
async function saveP(p) { await pool.query('INSERT INTO players (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2', [p.id, JSON.stringify(p)]); }

// Class Player (Giữ nguyên logic của bạn)
class Player {
    constructor(id, name, data = null) {
        if (data) { Object.assign(this, data); }
        else {
            this.id = id; this.name = name; this.level = 1; this.exp = 0; this.linhThach = 100; this.lastTrain = 0; this.wins = 0; this.lastDaily = 0; this.dongPhuLevel = 1; this.weapon = { name: "Tay Không", atk: 0 };
            const rand = Math.random();
            if (rand < 0.005) { this.tuChat = "👑 Tiên Đế"; this.multiplier = 10.0; }
            else if (rand < 0.10) { this.tuChat = "⚡ Thiên Tài"; this.multiplier = 2.0; }
            else { this.tuChat = "🌿 Phàm Nhân"; this.multiplier = 1.0; }
        }
        this.sync();
    }
    sync() {
        this.atk = 10 + Math.floor(this.level * 5 * this.multiplier) + this.weapon.atk;
        let rIdx = Math.floor((this.level - 1) / 10);
        this.realm = rIdx >= realms.length ? "Tiên Nhân" : `${realms[rIdx]} Tầng ${((this.level - 1) % 10) + 1}`;
    }
}

// --- 3. XỬ LÝ LỆNH ---
client.once('ready', () => console.log(`✅ BOT ĐÃ ONLINE: ${client.user.tag}`));

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();
    const userId = message.author.id;

    if (cmd === 'dangky') {
        if (await getP(userId)) return message.reply('❌ Đã nhập môn!');
        await saveP(new Player(userId, message.author.username));
        return message.reply('🎉 Chào mừng gia nhập tiên giới!');
    }

    let pData = await getP(userId);
    if (!pData) return message.reply('⚠️ Gõ `!dangky` trước!');
    let p = new Player(pData.id, pData.name, pData);

    switch (cmd) {
        case 'help': message.reply(`📜 **Lệnh:** !tui, !tuluyen, !dotpha, !pk, !nangcap, !nhan, !top`); break;
        case 'tui': p.sync(); message.reply(`🎒 **${p.name}**\n🔮 ${p.realm}\n⚔️ ${p.atk} ATK\n💰 ${p.linhThach} LT`); break;
        case 'tuluyen': 
            let gain = Math.floor((Math.random() * 20 + 10) * p.multiplier);
            p.exp += gain; await saveP(p);
            message.reply(`🧘‍♂️ Tu luyện được ${gain} EXP.`); break;
        case 'dotpha': 
            let cost = p.level * 100;
            if (p.exp < cost) return message.reply(`❌ Cần ${cost} EXP`);
            p.exp -= cost; p.level += 1; p.sync(); await saveP(p);
            message.reply(`🎉 Chúc mừng đột phá lên **${p.realm}**!`); break;
        case 'top': {
            let res = await pool.query('SELECT data FROM players ORDER BY (data->>\'level\')::int DESC LIMIT 5');
            message.reply(res.rows.map((r, i) => `#${i+1} ${r.data.name}: Cấp ${r.data.level}`).join('\n')); break; }
    }
});

client.login(process.env.DISCORD_TOKEN).catch(e => console.error("❌ LỖI ĐĂNG NHẬP:", e));
