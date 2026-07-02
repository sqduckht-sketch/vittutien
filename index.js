const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
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
        this.realm = rIdx >= realms.length ? "Tiên Nhân" : `${realms[rIdx]} Tầng ${((this.level - 1) % 10) + 1}`;
    }
}

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const userId = message.author.id;

    if (command === 'dangky') {
        if (players.has(userId)) return message.reply('❌ Đạo hữu đã nhập môn rồi!');
        players.set(userId, new Player(userId, message.author.username));
        return message.reply(`🎉 Chào mừng **${message.author.username}** nhập môn!`);
    }

    if (!players.has(userId)) return message.reply('⚠️ Hãy gõ `!dangky` trước nhé!');
    let p = players.get(userId);

    // KHỐI SWITCH CỦA ĐẠO HỮU ĐẶT Ở ĐÂY:
    switch (command) {
        case 'help':
            const helpEmbed = new EmbedBuilder().setColor(0x0099FF).setTitle('📜 TÀNG KINH CÁC - VỊT TU TIÊN')
                .addFields(
                    { name: '⚔️ Lệnh cơ bản', value: '`!dangky`, `!tui`, `!tuluyen`, `!dotpha`, `!dao`, `!mo`, `!pk @user`' },
                    { name: '🏆 Thông tin', value: '`!top` - Xem bảng xếp hạng' },
                    { name: '👑 Lệnh Admin', value: '`!setchat @user [1-5]`, `!adminbuff`, `!reset`' }
                );
            message.reply({ embeds: [helpEmbed] });
            break;
        case 'tui':
        case 'status':
            message.reply(`🎒 **${p.name}**\n🔮 ${p.realm}\n✨ Tu vi: ${p.exp}/${p.level * 100}\n🧬 ${p.tuChat}\n💰 ${p.linhThach} LT | 💎 ${p.daThachAnh} Đá`);
            break;
        case 'top':
            const topPlayers = [...players.values()].sort((a, b) => b.level - a.level).slice(0, 5);
            const topEmbed = new EmbedBuilder().setTitle('🏆 BẢNG XẾP HẠNG TIÊN GIỚI').setColor(0xFFD700);
            topPlayers.forEach((player, i) => topEmbed.addFields({ name: `#${i + 1} ${player.name}`, value: `Cấp: ${player.level} - ${player.realm}` }));
            message.reply({ embeds: [topEmbed] });
            break;
        case 'tuluyen':
            if (Date.now() - p.lastTrain < 10000) return message.reply('⚠️ Đang tĩnh tâm, chờ 10s!');
            let gain = Math.floor((Math.random() * 16 + 15) * p.multiplier);
            p.exp += gain; p.lastTrain = Date.now();
            message.reply(`🧘‍♂️ Tu luyện nhận ${gain} EXP.`);
            break;
        case 'dotpha':
            let cost = p.level * 100;
            if (p.exp < cost) return message.reply(`❌ Cần ${cost} EXP!`);
            if (Math.random() < 0.7) { p.exp -= cost; p.level += 1; p.updateRealm(); message.reply(`🎉 Lên **${p.realm}**!`); }
            else { p.exp = Math.floor(p.exp * 0.8); message.reply(`💥 Đột phá thất bại!`); }
            break;
        case 'setchat':
            if (userId !== ADMIN_ID) return;
            let targetSet = message.mentions.users.first();
            let pSet = players.get(targetSet.id);
            let type = parseInt(args[1]);
            const config = { 1: ["🔥 Tuyệt Thế Thiên Kiêu", 3.0], 2: ["⚡ Thiên Tài", 2.0], 3: ["💎 Ưu Tú", 1.5], 4: ["🌿 Phàm Nhân Căn Cốt", 1.2], 5: ["🤡 Ngu Si Đần Độn", 0.5] };
            if(config[type]) { pSet.tuChat = config[type][0]; pSet.multiplier = config[type][1]; message.reply(`👑 Đã chỉnh tư chất.`); }
            break;
        case 'adminbuff':
            if (userId !== ADMIN_ID) return;
            let targetBuff = message.mentions.users.first();
            let amount = parseInt(args[2]);
            if (args[0] === 'exp') players.get(targetBuff.id).exp += amount;
            else players.get(targetBuff.id).linhThach += amount;
            message.reply(`👑 Đã buff.`);
            break;
    }
});

client.login(process.env.DISCORD_TOKEN);
