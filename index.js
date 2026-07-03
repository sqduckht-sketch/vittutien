const { Client, GatewayIntentBits } = require('discord.js');
const { Pool } = require('pg');
const express = require('express');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Kết nối PostgreSQL bằng DATABASE_URL từ Environment Variables
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Tự động tạo bảng dữ liệu nếu chưa có
pool.query(`CREATE TABLE IF NOT EXISTS players (id VARCHAR(255) PRIMARY KEY, data JSONB)`);

const realms = ["Luyện Khí", "Trúc Cơ", "Kết Đan", "Nguyên Anh", "Hóa Thần", "Luyện Hư", "Hợp Thể", "Độ Kiếp", "Đại Thừa"];
const ADMIN_ID = '1126092277220122634';

// Hàm đọc dữ liệu từ DB
async function getPlayer(id) {
    const res = await pool.query('SELECT data FROM players WHERE id = $1', [id]);
    return res.rows.length > 0 ? res.rows[0].data : null;
}

// Hàm lưu dữ liệu vào DB
async function savePlayer(p) {
    await pool.query('INSERT INTO players (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2', [p.id, JSON.stringify(p)]);
}

class Player {
    constructor(id, name) {
        this.id = id; this.name = name; this.level = 1; this.exp = 0;
        this.linhThach = 100; this.lastTrain = 0; this.wins = 0; this.lastDaily = 0;
        this.dongPhuLevel = 1; this.weapon = { name: "Tay Không", atk: 0 };
        const rand = Math.random();
        if (rand < 0.005) { this.tuChat = "👑 Tiên Đế"; this.multiplier = 10.0; }
        else { this.tuChat = "🌿 Phàm Nhân"; this.multiplier = 1.0; }
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
    const command = args.shift().toLowerCase();
    const userId = message.author.id;

    if (command === 'dangky') {
        let p = await getPlayer(userId);
        if (p) return message.reply('❌ Đã nhập môn!');
        let newPlayer = new Player(userId, message.author.username);
        await savePlayer(newPlayer);
        return message.reply('🎉 Chào mừng gia nhập tiên giới!');
    }

    let pData = await getPlayer(userId);
    if (!pData) return message.reply('⚠️ Gõ `!dangky` trước!');
    
    // Tạo lại class Player từ dữ liệu JSON
    let p = Object.assign(new Player(pData.id, pData.name), pData);
    p.sync();

    if (command === 'tui') {
        message.reply(`🎒 **${p.name}**\n🧬 ${p.tuChat}\n🔮 ${p.realm}\n⚔️ ${p.atk} ATK\n💰 ${p.linhThach} LT`);
    } else if (command === 'tuluyen') {
        if (Date.now() - p.lastTrain < 10000) return message.reply('⚠️ Đang tĩnh tâm!');
        p.exp += Math.floor((Math.random() * 16 + 15) * p.multiplier);
        p.lastTrain = Date.now();
        await savePlayer(p);
        message.reply(`🧘‍♂️ **Tu luyện thành công!** EXP hiện tại: ${p.exp}`);
    }
    // Bạn có thể thêm các lệnh khác tương tự...
});

const app = express();
app.listen(process.env.PORT || 3000);
client.login(process.env.DISCORD_TOKEN);
