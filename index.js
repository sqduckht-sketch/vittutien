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

    return {
        id, name, level: 1, exp: 0, expNeeded: 100,
        realm: "Luyện Khí Tầng 1", linhThach: 10, lastTrain: 0,
        daThachAnh: 0, tuChat, multiplier
    };
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

    // Lệnh ĐỘT PHÁ tích hợp nút bấm
    if (command === 'dotpha') {
        const requiredExp = p.level * 200;
        if (p.exp < requiredExp) return message.reply(`❌ Cần ${requiredExp} EXP để đột phá.`);

        let daiCanhGioi = Math.floor((p.level - 1) / 10);
        let baseRate = 1.0 - (daiCanhGioi * 0.1);
        let bonus = (p.multiplier - 1.0) * 0.1;
        let successRate = Math.min(1.0, Math.max(0.05, baseRate + bonus));

        const confirm = new ButtonBuilder().setCustomId('confirm').setLabel('Đột phá').setStyle(ButtonStyle.Success);
        const cancel = new ButtonBuilder().setCustomId('cancel').setLabel('Hủy').setStyle(ButtonStyle.Danger);
        const row = new ActionRowBuilder().addComponents(confirm, cancel);

        const replyMsg = await message.reply({
            content: `🔮 **Đạo hữu chắc chắn muốn đột phá?**\n✨ Tỉ lệ thành công: **${(successRate * 100).toFixed(0)}%**`,
            components: [row]
        });

        const collector = replyMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 15000 });
        collector.on('collect', async i => {
            if (i.user.id !== userId) return i.reply({ content: '❌ Không phải của đạo hữu!', ephemeral: true });
            if (i.customId === 'confirm') {
                if (Math.random() < successRate) {
                    p.exp -= requiredExp;
                    p.level += 1;
                    updateRealm(p);
                    await i.update({ content: `⚡ Thành công! Đạo hữu đã đột phá lên **${p.realm}**.`, components: [] });
                } else {
                    p.exp = Math.floor(p.exp * 0.7);
                    await i.update({ content: `💥 Đột phá thất bại! Kinh mạch chấn động, tu vi giảm sút!`, components: [] });
                }
            } else {
                await i.update({ content: '🛡️ Đạo hữu đã chọn giữ vững tu vi.', components: [] });
            }
        });
        return;
    }

    // Các lệnh còn lại giữ nguyên
    if (command === 'help') {
        const embed = new EmbedBuilder().setColor(0x0099FF).setTitle('📜 TÀNG KINH CÁC').setDescription('!dangky, !dotpha, !tui, !tuluyen, !dao, !mo');
        return message.reply({ embeds: [embed] });
    }

    if (command === 'tui') {
        updateRealm(p);
        return message.reply(`🎒 **${p.name}**\n🔮 ${p.realm}\n✨ EXP: ${p.exp}/${p.expNeeded}\n🧬 Tư chất: ${p.tuChat}\n💰 Linh thạch: ${p.linhThach}`);
    }

    if (command === 'tuluyen') {
        if (Date.now() - p.lastTrain < 5000) return message.reply('⚠️ Đang nghẽn kinh mạch!');
        let expGained = Math.floor((Math.random() * 16 + 15) * p.multiplier);
        p.exp += expGained; p.lastTrain = Date.now();
        if (p.exp >= p.expNeeded) { p.exp -= p.expNeeded; p.level += 1; updateRealm(p); }
        return message.reply(`🧘‍♂️ Nhận ${expGained} EXP.`);
    }

    if (command === 'dao') {
        if (Math.random() < 0.3) { p.daThachAnh = (p.daThachAnh || 0) + 1; message.reply('💎 Đào được Đá Thạch Anh!'); }
        else { let g = Math.floor(Math.random() * 30) + 10; p.linhThach += g; message.reply(`⛏️ Đào được ${g} Linh thạch.`); }
    }
});

const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Vịt Tu Tiên đang bay!'));
app.listen(process.env.PORT || 3000);
client.login(process.env.DISCORD_TOKEN);
