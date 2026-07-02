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
        this.id = id; this.name = name; this.level = 1; this.exp = 0;
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
}

client.on('ready', () => console.log('Bot Vịt Tu Tiên Đã Đột Phá!'));

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const userId = message.author.id;

    if (command === 'dangky') {
        if (players.has(userId)) return message.reply('❌ Đạo hữu đã có tên trong tiên giới!');
        let p = new Player(userId, message.author.username);
        players.set(userId, p);
        return message.reply(`🎉 Chào mừng **${p.name}**! Tư chất: **${p.tuChat}**`);
    }

    if (!players.has(userId)) return message.reply('⚠️ Hãy gõ `!dangky` trước nhé!');
    let p = players.get(userId);

    switch (command) {
        case 'help':
            message.reply(`📜 **Danh sách lệnh:**\n!dangky, !status, !tuluyen, !dotpha, !dao, !mo, !pk @user\n*(Lệnh Admin: !reset, !adminbuff, !setchat)*`);
            break;

        case 'status': case 'tui':
            let expNext = p.level * 100;
            message.reply(`🎒 **${p.name}**\n🔮 ${p.realm}\n✨ Tu vi: ${p.exp}/${expNext}\n🧬 ${p.tuChat}\n💰 ${p.linhThach} LT | 💎 ${p.daThachAnh} Đá`);
            break;

        case 'tuluyen':
            if (Date.now() - p.lastTrain < 2000) return message.reply('⚠️ Đang tĩnh tâm, chờ chút!');
            let gain = Math.floor((Math.random() * 16 + 15) * p.multiplier);
            p.exp += gain; p.lastTrain = Date.now();
            message.reply(`🧘‍♂️ Tu luyện thành công, nhận ${gain} EXP. Hiện tại: ${p.realm}`);
            break;

        case 'dotpha':
            let cost = p.level * 100;
            if (p.exp < cost) return message.reply(`❌ Cần ${cost} EXP mới có thể đột phá!`);
            if (Math.random() < 0.7) {
                p.exp -= cost; p.level += 1; p.updateRealm();
                message.reply(`🎉 Chúc mừng! Đột phá thành công lên **${p.realm}**!`);
            } else {
                p.exp = Math.floor(p.exp * 0.8);
                message.reply(`💥 Đột phá thất bại! Kinh mạch tổn thương, mất một ít EXP.`);
            }
            break;

        case 'dao':
            if (Math.random() < 0.3) { p.daThachAnh = (p.daThachAnh || 0) + 1; message.reply('💎 Đào được Đá Thạch Anh!'); }
            else { let g = Math.floor(Math.random() * 30) + 10; p.linhThach += g; message.reply(`⛏️ Đào được ${g} Linh thạch.`); }
            break;

        case 'mo':
            if (!p.daThachAnh || p.daThachAnh <= 0) return message.reply('❌ Không có Đá Thạch Anh!');
            p.daThachAnh--;
            let r = Math.random();
            if (r < 0.7) { p.linhThach += 50; message.reply('🎁 50 Linh thạch!'); }
            else if (r < 0.95) { p.exp += 50; message.reply('✨ 50 EXP!'); }
            else { p.linhThach += 500; message.reply('👑 **ĐẠI VẬN MAY!** 500 Linh thạch!'); }
            break;

        case 'pk':
            let target = message.mentions.users.first();
            if (!target || !players.has(target.id)) return message.reply('Tag người chơi!');
            let p2 = players.get(target.id);
            if (Math.random() > 0.5) { let l = Math.floor(p2.linhThach * 0.1); p.linhThach += l; p2.linhThach -= l; message.reply(`⚔️ Thắng! Cướp được ${l} Linh thạch.`); }
            else message.reply(`🛡️ Thất bại!`);
            break;

        case 'setchat':
            if (message.author.id !== ADMIN_ID) return message.reply('❌ Chỉ Admin mới được dùng!');
            let targetSet = message.mentions.users.first();
            if (!targetSet || !players.has(targetSet.id)) return message.reply('❌ Hãy tag người chơi cần thay đổi!');
            let type = parseInt(args[1]);
            let pSet = players.get(targetSet.id);
            switch(type) {
                case 1: pSet.tuChat = "🔥 Tuyệt Thế Thiên Kiêu"; pSet.multiplier = 3.0; break;
                case 2: pSet.tuChat = "⚡ Thiên Tài"; pSet.multiplier = 2.0; break;
                case 3: pSet.tuChat = "💎 Ưu Tú"; pSet.multiplier = 1.5; break;
                case 4: pSet.tuChat = "🌿 Phàm Nhân Căn Cốt"; pSet.multiplier = 1.2; break;
                case 5: pSet.tuChat = "🤡 Ngu Si Đần Độn"; pSet.multiplier = 0.5; break;
                default: return message.reply('❌ Chọn từ 1 đến 5 thôi nhé!');
            }
            message.reply(`👑 Đã chỉnh tư chất của **${targetSet.username}** thành **${pSet.tuChat}**`);
            break;

        case 'reset':
            if (message.author.id !== ADMIN_ID) return;
            let t = message.mentions.users.first();
            if (t && players.has(t.id)) { players.delete(t.id); message.reply(`🗑️ Đã xóa: ${t.username}`); }
            break;

        case 'adminbuff':
            if (message.author.id !== ADMIN_ID) return;
            let targetBuff = message.mentions.users.first() || message.author;
            args[0] === 'exp' ? players.get(targetBuff.id).exp += parseInt(args[1]) : players.get(targetBuff.id).linhThach += parseInt(args[1]);
            message.reply(`👑 Đã buff cho ${targetBuff.username}.`);
            break;
    }
});

const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Vịt Tu Tiên đang bay...'));
app.listen(process.env.PORT || 3000);
client.login(process.env.DISCORD_TOKEN);
