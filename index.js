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

    if (command === 'help') {
        return message.reply('📜 Lệnh: `!dangky`, `!tui`, `!top`, `!tuluyen`, `!dao`, `!mo`, `!dotpha`, `!pk`, `!adminbuff`');
    }

    if (command === 'tui') { updateStats(p); updateRealm(p); return message.reply(`🎒 **${p.name}**\n🔮 ${p.realm}\n⚔️ ATK: ${p.atk} | 🛡️ DEF: ${p.def}\n✨ EXP: ${p.exp}/${p.expNeeded}\n💰 Linh thạch: ${p.linhThach}\n💎 Đá: ${p.daThachAnh || 0}`); }

    if (command === 'top') {
        const sorted = [...players.values()].sort((a, b) => b.level - a.level).slice(0, 5);
        const embed = new EmbedBuilder().setTitle('🏆 BẢNG XẾP HẠNG').setColor(0xFFD700);
        sorted.forEach((p, i) => embed.addFields({ name: `#${i+1} ${p.name}`, value: `Cấp: ${p.level} - ${p.realm}` }));
        return message.reply({ embeds: [embed] });
    }

    if (command === 'tuluyen') {
        if (Date.now() - p.lastTrain < 5000) return message.reply('⚠️ Đang nghẽn kinh mạch!');
        p.exp += Math.floor((Math.random() * 16 + 15) * p.multiplier); p.lastTrain = Date.now();
        if (p.exp >= p.expNeeded) { p.exp = 0; p.level += 1; p.expNeeded = Math.floor(p.expNeeded * 1.1); updateRealm(p); updateStats(p); }
        return message.reply(`🧘‍♂️ EXP: ${p.exp}/${p.expNeeded}`);
    }

    if (command === 'dao') {
        if (Date.now() - p.lastDao < 15000) return message.reply('⚠️ Cần nghỉ 30s sau khi đào!');
        p.lastDao = Date.now();
        if (Math.random() < 0.3) { p.daThachAnh = (p.daThachAnh || 0) + 1; message.reply('💎 Đào được Đá Thạch Anh!'); }
        else { let g = Math.floor(Math.random() * 30) + 10; p.linhThach += g; message.reply(`⛏️ Được ${g} Linh thạch.`); }
    }

    if (command === 'mo') {
        if (Date.now() - p.lastMo < 5000) return message.reply('⚠️ Cần chờ 60s để giải mã đá!');
        if (!p.daThachAnh || p.daThachAnh <= 0) return message.reply('❌ Không có Đá Thạch Anh!');
        p.lastMo = Date.now(); p.daThachAnh -= 1;
        let r = Math.random();
        if (r < 0.7) { p.linhThach += 50; message.reply('🎁 Được 50 Linh thạch!'); }
        else if (r < 0.95) { p.exp += 50; message.reply('✨ Được 50 EXP!'); }
        else { p.linhThach += 500; message.reply('👑 ĐẠI VẬN MAY! 500 Linh thạch!'); }
    }

    if (command === 'dotpha') {
        if ((p.level % 10 !== 0) || p.exp < p.expNeeded) return message.reply('❌ Chỉ khi đạt đỉnh phong tầng 10 mới có thể đột phá!');
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('confirm').setLabel('Đột phá').setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId('cancel').setLabel('Hủy').setStyle(ButtonStyle.Danger));
        const replyMsg = await message.reply({ content: `🔮 **Đột phá cảnh giới?**`, components: [row] });
        const collector = replyMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 15000 });
        collector.on('collect', async i => {
            if (i.user.id !== userId) return i.reply({ content: '❌ Không phải của đạo hữu!', ephemeral: true });
            if (i.customId === 'confirm') {
                if (Math.random() < 0.6) { p.exp = 0; p.level += 1; p.expNeeded = Math.floor(p.expNeeded * 1.5); updateRealm(p); updateStats(p); await i.update({ content: `⚡ Thành công! Đã lên ${p.realm}.`, components: [] }); }
                else { p.exp = Math.floor(p.exp * 0.5); await i.update({ content: `💥 Thất bại!`, components: [] }); }
            } else await i.update({ content: '🛡️ Đã hủy.', components: [] });
        });
    }

    if (command === 'pk') {
        let target = message.mentions.users.first();
        if (!target || !players.has(target.id)) return message.reply('Hãy tag đối thủ!');
        let p2 = players.get(target.id);
        updateStats(p); updateStats(p2);
        if (p.atk > p2.def + 10) { let l = Math.floor(p2.linhThach * 0.1); p.linhThach += l; p2.linhThach -= l; message.reply(`⚔️ Thắng! Cướp được ${l} linh thạch.`); }
        else message.reply('🛡️ Đối thủ thủ quá cứng!');
    }

    if (command === 'adminbuff') {
        if (message.author.id !== '1126092277220122634') return message.reply('❌ Chỉ chủ nhân!');
        let type = args[0], amount = parseInt(args[1]);
        let target = message.mentions.users.first() || message.author;
        let tp = players.get(target.id);
        if (type === 'exp') tp.exp += amount; else if (type === 'thach') tp.linhThach += amount;
        message.reply(`👑 Đã buff!`);
    }
});

client.login(process.env.DISCORD_TOKEN);
