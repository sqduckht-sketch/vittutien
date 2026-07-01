const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const players = new Map();

// Hàm khởi tạo nhân vật (5 cấp tư chất)
function createPlayer(id, name) {
    const rand = Math.random();
    let tuChat, multiplier;
    if (rand < 0.02) { tuChat = "🔥 Tuyệt Thế Thiên Kiêu"; multiplier = 3.0; }
    else if (rand < 0.10) { tuChat = "⚡ Thiên Tài"; multiplier = 2.0; }
    else if (rand < 0.25) { tuChat = "💎 Ưu Tú"; multiplier = 1.5; }
    else if (rand < 0.55) { tuChat = "🌿 Phàm Nhân Căn Cốt"; multiplier = 1.2; }
    else { tuChat = "🤡 Ngu Si Đần Độn"; multiplier = 0.5; }

    return {
        id: id, name: name, level: 1, exp: 0, expNeeded: 100,
        realm: "Luyện Khí Tầng 1", linhThach: 10, lastTrain: 0,
        daThachAnh: 0, tuChat: tuChat, multiplier: multiplier
    };
}

const realms = ["Luyện Khí", "Trúc Cơ", "Kết Đan", "Nguyên Anh", "Hóa Thần", "Luyện Hư", "Hợp Thể", "Độ Kiếp", "Đại Thừa"];
function updateRealm(p) {
    let rIdx = Math.floor((p.level - 1) / 10);
    let sLvl = ((p.level - 1) % 10) + 1;
    p.realm = rIdx >= realms.length ? "Tiên Nhân" : `${realms[rIdx]} Tầng ${sLvl}`;
}

client.on('ready', () => console.log('Bot Vịt Tu Tiên đã xuất thế!'));

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const userId = message.author.id;

    // Lệnh Đăng ký
    if (command === 'dangky') {
        if (players.has(userId)) return message.reply('❌ Đạo hữu đã có tên trong tiên giới!');
        let p = createPlayer(userId, message.author.username);
        players.set(userId, p);
        return message.reply(`🎉 Chào mừng **${p.name}**!\n📜 Tư chất: **${p.tuChat}** (Hệ số EXP: x${p.multiplier})`);
    }

    if (!players.has(userId)) return message.reply('⚠️ Hãy gõ `!dangky` để nhập môn trước nhé!');
    let p = players.get(userId);

    // Lệnh Status
    if (command === 'status' || command === 'profile' || command === 'tui') {
        updateRealm(p);
        return message.reply(`🎒 **${p.name}**\n🔮 Cảnh giới: ${p.realm}\n✨ Tu vi: ${p.exp}/${p.expNeeded}\n🧬 Tư chất: ${p.tuChat} (x${p.multiplier})\n💰 Linh thạch: ${p.linhThach}\n💎 Đá Thạch Anh: ${p.daThachAnh || 0}`);
    }

    // Lệnh Tu Luyện
    if (command === 'tuluyen' || command === 'train') {
        if (Date.now() - p.lastTrain < 15000) return message.reply(`⚠️ Đang nghẽn kinh mạch, chờ ${Math.ceil((15000 - (Date.now() - p.lastTrain))/1000)} giây nữa!`);
        let expGained = Math.floor((Math.random() * 16 + 15) * p.multiplier);
        p.exp += expGained; p.lastTrain = Date.now();
        if (p.exp >= p.expNeeded) { p.exp -= p.expNeeded; p.level += 1; p.expNeeded = Math.floor(p.expNeeded * 1.2); updateRealm(p); }
        return message.reply(`🧘‍♂️ Nhận ${expGained} EXP. Cảnh giới: ${p.realm}`);
    }

    // Lệnh Đào khoáng
    if (command === 'dao') {
        if (Math.random() < 0.3) { p.daThachAnh = (p.daThachAnh || 0) + 1; message.reply('💎 Đào được Đá Thạch Anh!'); }
        else { let g = Math.floor(Math.random() * 30) + 10; p.linhThach += g; message.reply(`⛏️ Đào được ${g} Linh thạch.`); }
    }

    // Lệnh Mở đá
    if (command === 'mo') {
        if (!p.daThachAnh || p.daThachAnh <= 0) return message.reply('❌ Không có Đá Thạch Anh!');
        p.daThachAnh -= 1;
        const msg = await message.reply('💎 Đang khai mở... 🌀');
        const frames = ['🌀 Đang khai mở...', '⚡ Giải mã...', '💥 Nứt ra...', '✨ Nhận kết quả...'];
        for (let f of frames) { await new Promise(r => setTimeout(r, 800)); await msg.edit(f); }
        let r = Math.random();
        if (r < 0.7) { p.linhThach += 50; await msg.edit('🎁 Mở được 50 Linh thạch!'); }
        else if (r < 0.95) { p.exp += 50; await msg.edit('✨ Mở được 50 EXP!'); }
        else { p.linhThach += 500; await msg.edit('👑 **ĐẠI VẬN MAY!** Mở được 500 Linh thạch!'); }
    }

    // Lệnh PK
    if (command === 'pk') {
        let target = message.mentions.users.first();
        if (!target || !players.has(target.id)) return message.reply('Hãy tag người chơi!');
        let p2 = players.get(target.id);
        if (Math.random() > 0.5) { let l = Math.floor(p2.linhThach * 0.1); p.linhThach += l; p2.linhThach -= l; message.reply(`⚔️ Thắng! Cướp được ${l} Linh thạch.`); }
        else message.reply(`🛡️ Thất bại!`);
    }

    // Lệnh Admin
    if (command === 'adminbuff') {
        if (message.author.id !== '1126092277220122634') return message.reply('❌ Chỉ chủ nhân!');
        let type = args[0], amount = parseInt(args[1]);
        let target = message.mentions.users.first() || message.author;
        let tp = players.get(target.id);
        if (type === 'exp') tp.exp += amount; else if (type === 'thach') tp.linhThach += amount;
        message.reply(`👑 Đã buff cho ${target.username}.`);
    }
});

const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Vịt Tu Tiên is running!'));
app.listen(process.env.PORT || 3000);
client.login(process.env.DISCORD_TOKEN);
