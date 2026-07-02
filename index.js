const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const players = new Map();
const realms = ["Luyện Khí", "Trúc Cơ", "Kết Đan", "Nguyên Anh", "Hóa Thần", "Luyện Hư", "Hợp Thể", "Độ Kiếp", "Đại Thừa"];
const ADMIN_ID = '1126092277220122634';

class Player {
    constructor(id, name) {
        const rand = Math.random();
        this.id = id; this.name = name; this.level = 1; this.exp = 0; this.expNeeded = 100;
        this.linhThach = 10; this.lastTrain = 0; this.daThachAnh = 0;
        
        if (rand < 0.02) { this.tuChat = "🔥 Tuyệt Thế Thiên Kiêu"; this.multiplier = 3.0; }
        else if (rand < 0.10) { this.tuChat = "⚡ Thiên Tài"; this.multiplier = 2.0; }
        else if (rand < 0.25) { this.tuChat = "💎 Ưu Tú"; this.multiplier = 1.5; }
        else if (rand < 0.55) { this.tuChat = "🌿 Phàm Nhân Căn Cốt"; this.multiplier = 1.2; }
        else { this.tuChat = "🤡 Ngu Si Đần Độn"; this.multiplier = 0.5; }
        this.updateRealm();
    }

    updateRealm() {
        let rIdx = Math.floor((this.level - 1) / 10);
        let sLvl = ((this.level - 1) % 10) + 1;
        this.realm = rIdx >= realms.length ? "Tiên Nhân" : `${realms[rIdx]} Tầng ${sLvl}`;
    }

    addExp(amount) {
        this.exp += Math.floor(amount * this.multiplier);
        while (this.exp >= this.expNeeded) {
            this.exp -= this.expNeeded;
            this.level += 1;
            this.expNeeded = Math.floor(this.expNeeded * 1.2);
        }
        this.updateRealm();
    }
}

client.on('ready', () => console.log('Bot Vịt Tu Tiên đã xuất thế!'));

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;
    
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const userId = message.author.id;

    if (command === 'dangky') {
        if (players.has(userId)) return message.reply('❌ Đạo hữu đã có tên trong tiên giới!');
        let p = new Player(userId, message.author.username);
        players.set(userId, p);
        return message.reply(`🎉 Chào mừng **${p.name}**!\n📜 Tư chất: **${p.tuChat}** (x${p.multiplier})`);
    }

    if (!players.has(userId)) return message.reply('⚠️ Hãy gõ `!dangky` trước nhé!');
    let p = players.get(userId);

    switch (command) {
        case 'help':
            message.reply(`📜 **Danh sách lệnh Tiên Giới:**
\`!dangky\` - Gia nhập môn phái
\`!status\` - Xem thông tin bản thân
\`!tuluyen\` - Tăng tu vi
\`!dao\` - Đào khoáng kiếm tài nguyên
\`!mo\` - Khai mở Đá Thạch Anh
\`!pk @nguoidung\` - Thách đấu đối thủ
*(Lệnh Admin: !reset @user, !adminbuff)*`);
            break;

        case 'status': case 'profile': case 'tui':
            message.reply(`🎒 **${p.name}**\n🔮 ${p.realm}\n✨ EXP: ${p.exp}/${p.expNeeded}\n🧬 ${p.tuChat}\n💰 ${p.linhThach} LT | 💎 ${p.daThachAnh} Đá`);
            break;

        case 'tuluyen': case 'tu':
            if (Date.now() - p.lastTrain < 2000) return message.reply(`⚠️ Chờ ${Math.ceil((15000 - (Date.now() - p.lastTrain))/1000)}s!`);
            let gain = Math.floor(Math.random() * 16 + 15);
            p.addExp(gain); p.lastTrain = Date.now();
            message.reply(`🧘‍♂️ Nhận ${Math.floor(gain * p.multiplier)} EXP. Cảnh giới: ${p.realm}`);
            break;

        case 'dao':
            if (Math.random() < 0.3) { p.daThachAnh++; message.reply('💎 Đào được Đá Thạch Anh!'); }
            else { let g = Math.floor(Math.random() * 30) + 10; p.linhThach += g; message.reply(`⛏️ Đào được ${g} Linh thạch.`); }
            break;

        case 'mo':
            if (!p.daThachAnh) return message.reply('❌ Không có Đá!');
            p.daThachAnh--;
            let r = Math.random();
            if (r < 0.7) { p.linhThach += 50; message.reply('🎁 50 Linh thạch!'); }
            else if (r < 0.95) { p.addExp(50); message.reply('✨ 50 EXP!'); }
            else { p.linhThach += 500; message.reply('👑 **ĐẠI VẬN MAY!** 500 Linh thạch!'); }
            break;

        case 'pk':
            let target = message.mentions.users.first();
            if (!target || !players.has(target.id)) return message.reply('Tag người chơi!');
            let p2 = players.get(target.id);
            if (Math.random() > 0.5) { let l = Math.floor(p2.linhThach * 0.1); p.linhThach += l; p2.linhThach -= l; message.reply(`⚔️ Thắng! Cướp ${l} Linh thạch.`); }
            else message.reply(`🛡️ Thất bại!`);
            break;

        case 'reset':
            if (message.author.id !== ADMIN_ID) return message.reply('❌ Lệnh này chỉ dành cho Admin!');
            let t = message.mentions.users.first();
            if (!t || !players.has(t.id)) return message.reply('❌ Tag người chơi hợp lệ để xóa!');
            players.delete(t.id);
            message.reply(`🗑️ Đã xóa dữ liệu của **${t.username}**.`);
            break;

        case 'adminbuff':
            if (message.author.id !== ADMIN_ID) return;
            let type = args[0], amount = parseInt(args[1]);
            let targetBuff = message.mentions.users.first() || message.author;
            let tp = players.get(targetBuff.id);
            type === 'exp' ? tp.addExp(amount) : tp.linhThach += amount;
            message.reply(`👑 Đã buff cho ${targetBuff.username}.`);
            break;
    }
});

const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Vịt Tu Tiên is running!'));
app.listen(process.env.PORT || 3000);
client.login(process.env.DISCORD_TOKEN);
