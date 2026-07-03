const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const players = new Map();
const realms = ["Luyện Khí", "Trúc Cơ", "Kết Đan", "Nguyên Anh", "Hóa Thần", "Luyện Hư", "Hợp Thể", "Độ Kiếp", "Đại Thừa"];
const ADMIN_ID = '1126092277220122634';
const CHANNEL_ID = '1522097762555138089';
let currentBicanh = null;

class Player {
    constructor(id, name) {
        const rand = Math.random();
        this.id = id; this.name = name; this.level = 1; this.exp = 0;
        this.linhThach = 100; this.lastTrain = 0; this.wins = 0; this.lastDaily = 0;
        this.dongPhuLevel = 1;
        this.weapon = { name: "Tay Không", atk: 0 };
        
        if (rand < 0.005) { this.tuChat = "👑 Tiên Đế"; this.multiplier = 10.0; }
        else if (rand < 0.015) { this.tuChat = "🌟 Thánh Nhân"; this.multiplier = 5.0; }
        else if (rand < 0.035) { this.tuChat = "🔥 Tuyệt Thế Thiên Kiêu"; this.multiplier = 3.0; }
        else if (rand < 0.10) { this.tuChat = "⚡ Thiên Tài"; this.multiplier = 2.0; }
        else if (rand < 0.25) { this.tuChat = "💎 Ưu Tú"; this.multiplier = 1.5; }
        else if (rand < 0.55) { this.tuChat = "🌿 Phàm Nhân Căn Cốt"; this.multiplier = 1.2; }
        else { this.tuChat = "🤡 Ngu Si Đần Độn"; this.multiplier = 0.5; }
        
        this.updateStats(); this.updateRealm();
    }
    updateStats() {
        this.atk = 10 + Math.floor(this.level * 5 * this.multiplier) + this.weapon.atk;
        this.maxHp = 100 + Math.floor(this.level * 20 * this.multiplier);
        this.hp = this.maxHp;
    }
    updateRealm() {
        let rIdx = Math.floor((this.level - 1) / 10);
        this.realm = rIdx >= realms.length ? "Tiên Nhân" : `${realms[rIdx]} Tầng ${((this.level - 1) % 10) + 1}`;
    }
}

function createBicanh() {
    const diffs = ["Thấp", "Trung bình", "Cao", "Địa ngục"];
    const idx = Math.floor(Math.random() * diffs.length);
    currentBicanh = { diff: diffs[idx], reward: (idx + 1) * 200, requiredAtk: (idx + 1) * 50 };
    const channel = client.channels.cache.get(CHANNEL_ID);
    if (channel) channel.send(`📢 **Bí cảnh ${currentBicanh.diff} xuất hiện!** Yêu cầu: ${currentBicanh.requiredAtk} ATK. Gõ \`!thamgia\`!`);
}

client.on('ready', () => { console.log(`Tiên giới đã khai mở!`); setInterval(createBicanh, 300000); });

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const userId = message.author.id;

    if (command === 'dangky') {
        if (players.has(userId)) return message.reply('❌ Đã nhập môn!');
        players.set(userId, new Player(userId, message.author.username));
        return message.reply('🎉 Chào mừng gia nhập tiên giới!');
    }
    if (!players.has(userId)) return message.reply('⚠️ Gõ `!dangky` trước!');
    let p = players.get(userId);

    // ADMIN
    if (['setchat', 'adminbuff', 'reset'].includes(command)) {
        if (userId !== ADMIN_ID) return;
        let target = message.mentions.users.first();
        if (!target || !players.has(target.id)) return;
        if (command === 'setchat') {
            let type = parseInt(args[1]);
            const config = { 1: ["👑 Tiên Đế", 10.0], 2: ["🌟 Thánh Nhân", 5.0], 7: ["🤡 Ngu Si", 0.5] };
            if(config[type]) { p.tuChat = config[type][0]; p.multiplier = config[type][1]; p.updateStats(); message.reply(`✅ Đã chỉnh tư chất!`); }
        } else if (command === 'adminbuff') { p.level += 10; p.updateStats(); message.reply("✅ Buff 10 cấp!"); }
        else if (command === 'reset') { players.delete(target.id); message.reply(`🗑️ Đã xóa!`); }
        return;
    }

    // NGƯỜI CHƠI
    switch (command) {
        case 'help': message.reply(`📜 **Lệnh:** !tui, !tuluyen, !dotpha, !thamgia, !pk @user, !nangcap, !top, !top_pk, !top_giaucu, !cuop @user, !nhan, !luyenkhi`); break;
        case 'tui': p.updateStats(); message.reply(`🎒 **${p.name}**\n🧬 ${p.tuChat} (x${p.multiplier})\n🔮 ${p.realm}\n⚔️ ${p.atk} ATK\n💰 ${p.linhThach} LT\n🏠 Động Phủ: ${p.dongPhuLevel}`); break;
        case 'tuluyen': if (Date.now() - p.lastTrain < 10000) return message.reply('⚠️ Đang tĩnh tâm!'); p.exp += Math.floor((Math.random() * 16 + 15) * p.multiplier * (1 + p.dongPhuLevel * 0.2)); p.lastTrain = Date.now(); message.reply(`🧘‍♂️ **Tu luyện:** +EXP!`); break;
        case 'dotpha': let cost = p.level * 100; if (p.exp < cost) return message.reply(`❌ Cần ${cost} EXP!`); if (Math.random() < 0.7) { p.exp -= cost; p.level += 1; p.updateStats(); message.reply(`🎉 Lên ${p.realm}!`); } else { p.exp = Math.floor(p.exp * 0.8); message.reply(`💥 Thất bại!`); } break;
        case 'thamgia': if (!currentBicanh) return message.reply('❌ Không có!'); if (p.atk < currentBicanh.requiredAtk) return message.reply(`❌ Yếu quá!`); p.linhThach += currentBicanh.reward; message.reply(`✅ Nhận ${currentBicanh.reward} LT!`); currentBicanh = null; break;
        case 'pk': let t = message.mentions.users.first(); if(!t || !players.has(t.id)) return message.reply('❌ Tag đối thủ!'); let p2 = players.get(t.id); if(p.linhThach < 50 || p2.linhThach < 50) return message.reply('❌ Cần 50 LT cược!'); if(Math.random()*(p.atk+p2.atk) < p.atk) { p.linhThach += 50; p2.linhThach -= 50; p.wins++; message.reply('⚔️ Thắng!'); } else { p2.linhThach += 50; p.linhThach -= 50; p2.wins++; message.reply('💀 Thua!'); } break;
        case 'nangcap': let nC = p.dongPhuLevel * 500; if(p.linhThach < nC) return message.reply(`❌ Cần ${nC} LT!`); p.linhThach -= nC; p.dongPhuLevel++; message.reply(`🏠 Động phủ cấp ${p.dongPhuLevel}!`); break;
        case 'nhan': if (p.lastDaily && Date.now() - p.lastDaily < 86400000) return message.reply('⚠️ Mai nhận tiếp!'); p.linhThach += 500; p.lastDaily = Date.now(); message.reply('🎁 Nhận 500 LT!'); break;
        case 'luyenkhi': if(p.exp < 500) return message.reply('❌ Thiếu EXP!'); p.exp -= 500; p.linhThach += 200; message.reply('✨ +200 LT!'); break;
        case 'cuop': let v = message.mentions.users.first(); if (!v || !players.has(v.id)) return message.reply('❌ Tag nạn nhân!'); let p2 = players.get(v.id); if (p.level < p2.level) return message.reply('❌ Cướp cao thủ à?'); if (Math.random() < 0.5) { let l = Math.floor(p2.linhThach * 0.2); p.linhThach += l; p2.linhThach -= l; message.reply(`💰 Cướp được ${l} LT!`); } else message.reply(`👮 Bị bắt!`); break;
        case 'top': message.reply([...players.values()].sort((a,b)=>b.level-a.level).slice(0,5).map((pl,i)=>`#${i+1} ${pl.name}: Cấp ${pl.level}`).join('\n')); break;
        case 'top_pk': message.reply([...players.values()].sort((a,b)=>b.wins-a.wins).slice(0,5).map((pl,i)=>`#${i+1} ${pl.name}: ${pl.wins} thắng`).join('\n')); break;
        case 'top_giaucu': message.reply([...players.values()].sort((a,b)=>b.linhThach-a.linhThach).slice(0,5).map((pl,i)=>`#${i+1} ${pl.name}: ${pl.linhThach} LT`).join('\n')); break;
    }
});

const express = require('express');
const app = express();
app.listen(process.env.PORT || 3000, () => console.log('Tiên giới online!'));
client.login(process.env.DISCORD_TOKEN);
