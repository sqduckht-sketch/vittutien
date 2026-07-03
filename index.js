const { Client, GatewayIntentBits } = require('discord.js');
const { Pool } = require('pg');
const express = require('express');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

pool.query(`CREATE TABLE IF NOT EXISTS players (id VARCHAR(255) PRIMARY KEY, data JSONB)`);

const realms = ["Luyện Khí", "Trúc Cơ", "Kết Đan", "Nguyên Anh", "Hóa Thần", "Luyện Hư", "Hợp Thể", "Độ Kiếp", "Đại Thừa"];
const ADMIN_ID = '1126092277220122634';

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

client.once('ready', () => {
    console.log(`✅ Bot đã kết nối thành công tới Discord dưới tên: ${client.user.tag}`);
});

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
        case 'help': message.reply(`📜 **Lệnh:** !tui, !tuluyen, !dotpha, !pk @user, !nangcap, !top, !top_pk, !top_giaucu, !nhan, !luyenkhi`); break;
        case 'tui': p.sync(); message.reply(`🎒 **${p.name}**\n🧬 ${p.tuChat} (x${p.multiplier})\n🔮 ${p.realm}\n⚔️ ${p.atk} ATK\n💰 ${p.linhThach} LT\n🏠 Động Phủ: ${p.dongPhuLevel}`); break;
        case 'tuluyen': 
            if (Date.now() - p.lastTrain < 10000) return message.reply('⚠️ Đang tĩnh tâm!'); 
            let gain = Math.floor((Math.random() * 16 + 15) * p.multiplier * (1 + p.dongPhuLevel * 0.2)); 
            p.exp += gain; p.lastTrain = Date.now(); await saveP(p);
            message.reply(`🧘‍♂️ **Tu luyện:** +${gain} EXP\n📈 Tiến độ: ${p.exp}/${p.level * 100} EXP`); break;
        case 'dotpha': 
            let cost = p.level * 100; 
            if (p.exp < cost) return message.reply(`❌ Cần ${cost} EXP!`); 
            if (Math.random() < 0.7) { p.exp -= cost; p.level += 1; p.sync(); await saveP(p); message.reply(`🎉 Chúc mừng! Bạn đã đột phá lên **${p.realm}**!`); }
            else { p.exp = Math.floor(p.exp * 0.8); await saveP(p); message.reply(`💥 Đột phá thất bại! Mất 20% EXP.`); } break;
        case 'pk': {
            let t = message.mentions.users.first();
            if(!t || t.id === userId) return message.reply('❌ Tag đối thủ!');
            let p2Data = await getP(t.id);
            if(!p2Data) return message.reply('❌ Đối thủ chưa nhập môn!');
            let p2 = new Player(p2Data.id, p2Data.name, p2Data);
            if(p.linhThach < 50 || p2.linhThach < 50) return message.reply('❌ Cần 50 LT!');
            if(Math.random()*(p.atk+p2.atk) < p.atk) { p.linhThach += 50; p2.linhThach -= 50; p.wins++; await saveP(p); await saveP(p2); message.reply('⚔️ Bạn thắng 50 LT!'); } 
            else { p2.linhThach += 50; p.linhThach -= 50; p2.wins++; await saveP(p); await saveP(p2); message.reply('💀 Bạn thua 50 LT!'); }
            break; }
        case 'nangcap': 
            let nC = p.dongPhuLevel * 500; if(p.linhThach < nC) return message.reply(`❌ Cần ${nC} LT!`); 
            p.linhThach -= nC; p.dongPhuLevel++; await saveP(p); message.reply(`🏠 Động phủ cấp ${p.dongPhuLevel}!`); break;
        case 'nhan': if (p.lastDaily && Date.now() - p.lastDaily < 86400000) return message.reply('⚠️ Mai nhận tiếp!'); p.linhThach += 500; p.lastDaily = Date.now(); await saveP(p); message.reply('🎁 Nhận 500 LT!'); break;
        case 'luyenkhi': if(p.exp < 500) return message.reply('❌ Thiếu EXP!'); p.exp -= 500; p.linhThach += 200; await saveP(p); message.reply('✨ +200 LT!'); break;
        case 'top': {
            let res = await pool.query('SELECT data FROM players ORDER BY (data->>\'level\')::int DESC LIMIT 5');
            message.reply(res.rows.map((r, i) => `#${i+1} ${r.data.name}: Cấp ${r.data.level}`).join('\n')); break; }
        case 'top_pk': {
            let res = await pool.query('SELECT data FROM players ORDER BY (data->>\'wins\')::int DESC LIMIT 5');
            message.reply(res.rows.map((r, i) => `#${i+1} ${r.data.name}: ${r.data.wins} thắng`).join('\n')); break; }
        case 'top_giaucu': {
            let res = await pool.query('SELECT data FROM players ORDER BY (data->>\'linhThach\')::int DESC LIMIT 5');
            message.reply(res.rows.map((r, i) => `#${i+1} ${r.data.name}: ${r.data.linhThach} LT`).join('\n')); break; }
        case 'setchat':
            if (userId !== ADMIN_ID) return;
            let target = message.mentions.users.first();
            let tData = await getP(target?.id);
            if (!target || !tData) return;
            let tp = new Player(tData.id, tData.name, tData);
            let type = parseInt(args[1]);
            const config = { 1: ["👑 Tiên Đế", 10.0], 2: ["🌟 Thánh Nhân", 5.0], 3: ["🔥 Tuyệt Thế Thiên Kiêu", 3.0], 4: ["⚡ Thiên Tài", 2.0], 5: ["💎 Ưu Tú", 1.5], 6: ["🌿 Phàm Nhân Căn Cốt", 1.2], 7: ["🤡 Ngu Si Đần Độn", 0.5] };
            if(config[type]) { tp.tuChat = config[type][0]; tp.multiplier = config[type][1]; tp.sync(); await saveP(tp); message.reply(`✅ Đã chỉnh tư chất!`); }
            break;
    }
});

client.login(process.env.DISCORD_TOKEN).catch(e => console.error("❌ Lỗi Token:", e));
const app = express();
app.listen(process.env.PORT || 3000);
