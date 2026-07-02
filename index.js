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

    return { id, name, level: 1, exp: 0, expNeeded: 100, realm: "Luyện Khí Tầng 1", linhThach: 10, lastTrain: 0, daThachAnh: 0, tuChat, multiplier };
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
        if (players.has(userId)) return message.reply('❌ Đạo hữu đã có tên trong tiên giới!');
        let p = createPlayer(userId, message.author.username);
        players.set(userId, p);
        return message.reply(`🎉 Chào mừng **${p.name}**!\n📜 Tư chất: **${p.tuChat}** (x${p.multiplier})`);
    }

    if (!players.has(userId)) return message.reply('⚠️ Hãy gõ `!dangky` để nhập môn trước!');
    let p = players.get(userId);

    // Lệnh HELP
    if (command === 'help') {
        const embed = new EmbedBuilder().setColor(0x0099FF).setTitle('📜 TÀNG KINH CÁC - VỊT TU TIÊN')
            .setDescription('Các lệnh hiện có:\n`!dangky`, `!tui`, `!tuluyen`, `!dao`, `!mo`, `!dotpha`, `!pk`, `!adminbuff`');
        return message.reply({ embeds: [embed] });
    }

    // Lệnh ĐỘT PHÁ
    if (command === 'dotpha') {
        let currentLevelInRealm = (p.level - 1) % 10 + 1;
        if (currentLevelInRealm !== 10 || p.exp < p.expNeeded) return message.reply('❌ Chỉ khi đạt đỉnh phong tầng 10 (đầy EXP) mới có thể `!dotpha`.');

        let daiCanhGioi = Math.floor((p.level - 1) / 10);
        let baseRate = 1.0 - (daiCanhGioi * 0.1);
        let bonus = (p.multiplier - 1.0) * 0.1;
        let successRate = Math.min(1.0, Math.max(0.05, baseRate + bonus));

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('confirm').setLabel('Đột phá').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('cancel').setLabel('Hủy').setStyle(ButtonStyle.Danger)
        );

        const replyMsg = await message.reply({ content: `🔮 **Đột phá đại cảnh giới?**\n✨ Tỉ lệ: **${(successRate * 100).toFixed(0)}%**`, components: [row] });
        const collector = replyMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 15000 });
        collector.on('collect', async i => {
            if (i.user.id !== userId) return i.reply({ content: '❌ Không phải của đạo hữu!', ephemeral: true });
            if (i.customId === 'confirm') {
                if (Math.random() < successRate) {
                    p.exp = 0; p.level += 1; p.expNeeded = Math.floor(p.expNeeded * 1.5); updateRealm(p);
                    await i.update({ content: `⚡ Thành công! Đã lên **${p.realm}**. Độ khó tăng: **${p.expNeeded} EXP/tầng**.`, components: [] });
                } else {
                    p.exp = Math.floor(p.exp * 0.5);
                    await i.update({ content: `💥 Thất bại! Kinh mạch chấn động!`, components: [] });
                }
            } else await i.update({ content: '🛡️ Đạo hữu đã chọn giữ vững tu vi.', components: [] });
        });
        return;
    }

    // Lệnh TULUYEN
    if (command === 'tuluyen') {
        if (Date.now() - p.lastTrain < 5000) return message.reply('⚠️ Đang nghẽn kinh mạch!');
        let expGained = Math.floor((Math.random() * 16 + 15) * p.multiplier);
        p.lastTrain = Date.now();
        let currentLevelInRealm = (p.level - 1) % 10 + 1;
        if (currentLevelInRealm === 10 && p.exp + expGained >= p.expNeeded) {
            p.exp = p.expNeeded;
            return message.reply(`⚠️ **Đỉnh phong!** Cần ` + '`!dotpha`' + ` để vượt cảnh giới. Hiện tại: ${p.exp}/${p.expNeeded}`);
        }
        p.exp += expGained;
        if (p.exp >= p.expNeeded) {
            p.exp = 0; p.level += 1; p.expNeeded = Math.floor(p.expNeeded * 1.1); updateRealm(p);
            return message.reply(`🧘‍♂️ Đột phá tầng! Hiện tại: ${p.realm}. Cần ${p.expNeeded} EXP để tiếp tục.`);
        }
        return message.reply(`🧘‍♂️ Nhận ${expGained} EXP. (${p.exp}/${p.expNeeded})`);
    }

    // Lệnh MO
    if (command === 'mo') {
        if (!p.daThachAnh || p.daThachAnh <= 0) return message.reply('❌ Không có Đá Thạch Anh!');
        p.daThachAnh -= 1;
        let r = Math.random();
        if (r < 0.7) { p.linhThach += 50; message.reply('🎁 Mở được 50 Linh thạch!'); }
        else if (r < 0.95) { p.exp += 50; message.reply('✨ Mở được 50 EXP!'); }
        else { p.linhThach += 500; message.reply('👑 ĐẠI VẬN MAY! Mở được 500 Linh thạch!'); }
    }

    // Các lệnh còn lại
    if (command === 'tui') { updateRealm(p); return message.reply(`🎒 **${p.name}**\n🔮 ${p.realm}\n✨ EXP: ${p.exp}/${p.expNeeded}\n🧬 Tư chất: ${p.tuChat}\n💰 Linh thạch: ${p.linhThach}\n💎 Đá Thạch Anh: ${p.daThachAnh || 0}`); }
    if (command === 'dao') {
        if (Math.random() < 0.3) { p.daThachAnh = (p.daThachAnh || 0) + 1; message.reply('💎 Đào được Đá Thạch Anh!'); }
        else { let g = Math.floor(Math.random() * 30) + 10; p.linhThach += g; message.reply(`⛏️ Đào được ${g} Linh thạch.`); }
    }
    if (command === 'pk') {
        let target = message.mentions.users.first();
        if (!target || !players.has(target.id)) return message.reply('Hãy tag người chơi!');
        let p2 = players.get(target.id);
        if (Math.random() > 0.5) { let l = Math.floor(p2.linhThach * 0.1); p.linhThach += l; p2.linhThach -= l; message.reply(`⚔️ Thắng! Cướp được ${l} Linh thạch.`); }
        else message.reply(`🛡️ Thất bại!`);
    }
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
app.get('/', (req, res) => res.send('Vịt Tu Tiên đang bay!'));
app.listen(process.env.PORT || 3000);
client.login(process.env.DISCORD_TOKEN);
