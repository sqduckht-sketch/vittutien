const { Client, GatewayIntentBits } = require('discord.js');
const { Pool } = require('pg');
const express = require('express');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

pool.query(`CREATE TABLE IF NOT EXISTS players (id VARCHAR(255) PRIMARY KEY, data JSONB)`);

const realms = ["Luyện Khí", "Trúc Cơ", "Kết Đan", "Nguyên Anh", "Hóa Thần", "Luyện Hư", "Hợp Thể", "Độ Kiếp", "Đại Thừa"];
const ADMIN_ID = '1126092277220122634';
let currentBicanh = null;

async function getP(id) { const res = await pool.query('SELECT data FROM players WHERE id = $1', [id]); return res.rows.length > 0 ? res.rows[0].data : null; }
async function saveP(p) { await pool.query('INSERT INTO players (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2', [p.id, JSON.stringify(p)]); }

class Player {
    constructor(id, name, data = null) {
        if (data) { Object.assign(this, data); }
        else {
            this.id = id; this.name = name; this.level = 1; this.exp = 0; this.linhThach = 100; this.lastTrain = 0; this.wins = 0; this.lastDaily = 0; this.dongPhuLevel = 1; this.weapon = { name: "Tay Không", atk: 0 };
            const rand = Math.random();
            if (rand < 0.005) { this.tuChat = "👑 Tiên Đế"; this.multiplier = 10.0; }
            else if (rand < 0.015) { this.tuChat = "🌟 Thánh Nhân"; this.multiplier = 5.0; }
            else if (rand < 0.035) { this.tuChat = "🔥 Tuyệt Thế Thiên Kiêu"; this.multiplier = 3.0; }
            else if (rand < 0.10) { this.tuChat = "⚡ Thiên Tài"; this.multiplier = 2.0; }
            else if (rand < 0.25) { this.tuChat = "💎 Ưu Tú"; this.multiplier = 1.5; }
            else if (rand < 0.55) { this.tuChat = "🌿 Phàm Nhân Căn Cốt"; this.multiplier = 1.2; }
            else { this.tuChat = "🤡 Ngu Si Đần Độn"; this.multiplier = 0.5; }
        }
        this.sync();
    }
    sync() {
        this.atk = 10 + Math.floor(this.level * 5 * this.multiplier) + this.weapon.atk;
        let rIdx = Math.floor((this.level - 1) / 10);
        this.realm = rIdx >= realms.length ? "Tiên Nhân" : `${realms[rIdx]} Tầng ${((this.level - 1) % 10) + 1}`;
    }
}

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

    if (cmd === 'tui') { p.sync(); message.reply(`🎒 **${p.name}**\n🧬 ${p.tuChat} (x${p.multiplier})\n🔮 ${p.realm}\n⚔️ ${p.atk} ATK\n💰 ${p.linhThach} LT`); }
    else if (cmd === 'tuluyen') {
        if (Date.now() - p.lastTrain < 10000) return message.reply('⚠️ Đang tĩnh tâm!');
        p.exp += Math.floor((Math.random() * 16 + 15) * p.multiplier);
        p.lastTrain = Date.now();
        await saveP(p);
        message.reply(`🧘‍♂️ **Tu luyện:** +EXP. Tiến độ: ${p.exp}/${p.level * 100}`);
    }
    else if (cmd === 'nhan') {
        if (p.lastDaily && Date.now() - p.lastDaily < 86400000) return message.reply('⚠️ Mai nhận tiếp!');
        p.linhThach += 500; p.lastDaily = Date.now();
        await saveP(p);
        message.reply('🎁 Nhận 500 LT!');
    }
    // Bạn có thể dán tiếp các lệnh !dotpha, !pk... vào đây theo cấu trúc trên
});

client.login(process.env.DISCORD_TOKEN);
const app = express();
app.listen(process.env.PORT || 3000, () => console.log('Tiên giới online!'));
