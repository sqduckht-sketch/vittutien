const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const players = new Map();

function createPlayer(id, name) {
    const rand = Math.random();
    let tuChat, multiplier;
    if (rand < 0.02) { tuChat = "🔥 Tuyệt Thế Thiên Kiêu"; multiplier = 3.0; }
    else if (rand < 0.10) { tuChat = "⚡ Thiên Tài"; multiplier = 2.0; }
    else if (rand < 0.25) { tuChat = "💎 Ưu Tú"; multiplier = 1.5; }
    else if (rand < 0.55) { tuChat = "🌿 Phàm Nhân Căn Cốt"; multiplier = 1.2; }
    else { tuChat = "🤡 Ngu Si Đần Độn"; multiplier = 0.5; }
    return { id, name, level: 1, exp: 0, expNeeded: 100, realm: "Luyện Khí Tầng 1", linhThach: 10, lastTrain: 0, lastDao: 0, lastMo: 0, daThachAnh: 0, tuChat, multiplier, atk: 10, def: 5 };
}

function updateStats(p) {
    p.atk = 10 + Math.floor(p.level * 5 * p.multiplier);
    p.def = 5 + Math.floor(p.level * 2);
}

const realms = ["Luyện Khí", "Trúc Cơ", "Kết Đan", "Nguyên Anh", "Hóa Thần", "Luyện Hư", "Hợp Thể", "Độ Kiếp", "Đại Thừa"];
function updateRealm(p) {
    let rIdx = Math.floor((p.level - 1) / 10);
    p.realm = rIdx >= realms.length ? "Tiên Nhân" : `${realms[rIdx]} Tầng ${((p.level - 1) % 10) + 1}`;
}

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const userId = message.author.id;

    if (command === 'dangky') {
        if (players.has(userId)) return message.reply('❌ Đạo hữu đã nhập môn rồi!');
        let p = createPlayer(userId, message.author.username);
        players.set(userId, p);
        return message.reply(`🎉 Chào mừng **${p.name}**! Tư chất: **${p.tuChat}**`);
    }

    if (!players.has(userId)) return message.reply('⚠️ Hãy gõ `!dangky`!');
    let p = players.get(userId);

    // Lệnh SETCHAT (Admin ban phúc)
    if (command === 'setchat') {
        if (message.author.id !== '1126092277220122634') return message.reply('❌ Chỉ chủ nhân mới có quyền!');
        let target = message.mentions.users.first();
        let newMulti = parseFloat(args[1]);
        if (!target || isNaN(newMulti)) return message.reply('⚠️ Cú pháp: `!setchat @tên [hệ_số]`');
        let tp = players.get(target.id);
        if (!tp) return message.reply('❌ Người này chưa nhập môn!');
        
        // Tự động phân loại tên tư chất
        if (newMulti >= 3.0) tp.tuChat = "🔥 Tuyệt Thế Thiên Kiêu";
        else if (newMulti >= 2.0) tp.tuChat = "⚡ Thiên Tài";
        else if (newMulti >= 1.5) tp.tuChat = "💎 Ưu Tú";
        else if (newMulti >= 1.2) tp.tuChat = "🌿 Phàm Nhân Căn Cốt";
        else tp.tuChat = "🤡 Ngu Si Đần Độn";
        
        tp.multiplier = newMulti;
        updateStats(tp);
        return message.reply(`👑 Đã ban phúc cho **${target.username}** thành **${tp.tuChat} (x${newMulti})**!`);
    }

    // Các lệnh khác...
    if (command === 'tui') { updateStats(p); updateRealm(p); return message.reply(`🎒 **${p.name}**\n🧬 Tư chất: ${p.tuChat}\n🔮 ${p.realm}\n⚔️ ATK: ${p.atk} | 🛡️ DEF: ${p.def}\n✨ EXP: ${p.exp}/${p.expNeeded}\n💰 Linh thạch: ${p.linhThach}`); }

    if (command === 'quay') {
        let amount = parseInt(args[0]);
        if (isNaN(amount) || amount <= 0 || amount > p.linhThach) return message.reply('⚠️ Lệnh `!quay [số]` (tối đa 1000, không vượt quá túi tiền).');
        p.linhThach -= amount;
        if (Math.random() < 0.45) {
            let win = amount * 2;
            p.linhThach += win;
            if (win >= 1000) message.channel.send(`🎉 **ĐẠI HỶ!** ${message.author.username} vừa quay trúng **${win}** Linh thạch!`);
            else message.reply(`🎰 Chúc mừng! Thắng được ${win} Linh thạch.`);
        } else {
            if (amount >= 500) message.channel.send(`🤡 **Đại bại!** ${message.author.username} vừa nướng ${amount} Linh thạch vào nhà cái!`);
            else message.reply(`💥 Tiếc quá! Mất trắng ${amount} Linh thạch.`);
        }
    }
    
    // ... (Giữ nguyên các lệnh !tuluyen, !dao, !mo, !pk, !dotpha cũ của đạo hữu)
});

client.login(process.env.DISCORD_TOKEN);
