const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
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
        this.linhThach = 10; this.lastTrain = 0;
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
        let baseAtk = 10 + Math.floor(this.level * 5 * this.multiplier);
        this.atk = baseAtk + this.weapon.atk;
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
    const rewards = [100, 300, 1000, 5000];
    const idx = Math.floor(Math.random() * diffs.length);
    currentBicanh = { diff: diffs[idx], reward: rewards[idx], requiredAtk: (idx + 1) * 50 };
    const channel = client.channels.cache.get(CHANNEL_ID);
    if (channel) {
        channel.send(`📢 **Bí cảnh xuất hiện!**\nĐộ khó: **${currentBicanh.diff}** | Yêu cầu: **${currentBicanh.requiredAtk} ATK**.\nGõ \`!thamgia\` để nhận ${currentBicanh.reward} LT!`);
    }
}

client.on('ready', () => {
    console.log(`Tiên giới đã khai mở!`);
    setInterval(createBicanh, 180000); 
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const userId = message.author.id;

    if (command === 'dangky') {
        if (players.has(userId)) return message.reply('❌ Đạo hữu đã nhập môn rồi!');
        players.set(userId, new Player(userId, message.author.username));
        return message.reply(`🎉 Chào mừng **${message.author.username}** gia nhập tiên giới!`);
    }

    if (!players.has(userId)) return message.reply('⚠️ Hãy gõ `!dangky` trước nhé!');
    let p = players.get(userId);

    switch (command) {
        case 'help':
            const helpEmbed = new EmbedBuilder().setColor(0x0099FF).setTitle('📜 TÀNG KINH CÁC')
                .addFields(
                    { name: '⚔️ Cơ bản', value: '`!tui`, `!tuluyen`, `!dotpha`, `!thamgia`, `!top`' },
                    { name: '👑 Admin', value: '`!setchat`, `!adminbuff`, `!reset`' }
                );
            message.reply({ embeds: [helpEmbed] });
            break;
        case 'tui':
            p.updateStats();
            message.reply(`🎒 **${p.name}**\n🔮 ${p.realm}\n❤️ HP: ${p.hp}/${p.maxHp} | ⚔️ ATK: ${p.atk} (${p.weapon.name})\n✨ EXP: ${p.exp}/${p.level * 100}\n🧬 ${p.tuChat}\n💰 ${p.linhThach} LT`);
            break;
        case 'top':
            const top = [...players.values()].sort((a, b) => b.level - a.level).slice(0, 5);
            const embed = new EmbedBuilder().setTitle('🏆 BẢNG XẾP HẠNG').setColor(0xFFD700);
            top.forEach((pl, i) => embed.addFields({ name: `#${i + 1} ${pl.name}`, value: `Cấp: ${pl.level} - ${pl.realm}` }));
            message.reply({ embeds: [embed] });
            break;
        case 'tuluyen':
            if (Date.now() - p.lastTrain < 10000) return message.reply('⚠️ Đang tĩnh tâm!');
            let gain = Math.floor((Math.random() * 16 + 15) * p.multiplier);
            p.exp += gain; p.lastTrain = Date.now();
            message.reply(`🧘‍♂️ **Tu luyện thành công!**\n+ ${gain} EXP.\n✨ EXP: ${p.exp}/${p.level * 100}\n🔮 Cảnh giới: ${p.realm}`);
            break;
        case 'dotpha':
            let cost = p.level * 100;
            if (p.exp < cost) return message.reply(`❌ Cần ${cost} EXP!`);
            if (Math.random() < 0.7) { p.exp -= cost; p.level += 1; p.updateRealm(); p.updateStats(); message.reply(`🎉 Chúc mừng! Lên **${p.realm}**!`); }
            else { p.exp = Math.floor(p.exp * 0.8); message.reply(`💥 Đột phá thất bại! EXP còn lại: ${p.exp}`); }
            break;
        case 'thamgia':
            if (!currentBicanh) return message.reply('❌ Hiện không có bí cảnh nào!');
            if (p.atk < currentBicanh.requiredAtk) return message.reply(`❌ Cần ${currentBicanh.requiredAtk} ATK.`);
            let msg = `🎉 Vượt bí cảnh **${currentBicanh.diff}**, nhận ${currentBicanh.reward} LT!`;
            if (Math.random() < 0.3) {
                const w = [{name: "Gậy Gỗ", atk: 20}, {name: "Kiếm Sắt", atk: 50}, {name: "Thần Kiếm", atk: 150}];
                p.weapon = w[Math.floor(Math.random() * w.length)];
                p.updateStats();
                msg += `\n✨ Rơi đồ: **${p.weapon.name}** (+${p.weapon.atk} ATK)!`;
            }
            p.linhThach += currentBicanh.reward;
            message.reply(msg);
            currentBicanh = null;
            break;
        case 'setchat':
            if (userId !== ADMIN_ID) return;
            let target = message.mentions.users.first();
            if (!target || !players.has(target.id)) return;
            let pSet = players.get(target.id);
            let type = parseInt(args[1]);
            const config = { 1: ["👑 Tiên Đế", 10.0], 2: ["🌟 Thánh Nhân", 5.0], 3: ["🔥 Tuyệt Thế Thiên Kiêu", 3.0], 4: ["⚡ Thiên Tài", 2.0], 5: ["💎 Ưu Tú", 1.5], 6: ["🌿 Phàm Nhân Căn Cốt", 1.2], 7: ["🤡 Ngu Si Đần Độn", 0.5] };
            if(config[type]) { pSet.tuChat = config[type][0]; pSet.multiplier = config[type][1]; pSet.updateStats(); message.reply(`👑 Đã chỉnh tư chất của ${target.username} thành **${pSet.tuChat}**!`); }
            break;
        case 'adminbuff':
            if (userId !== ADMIN_ID) return;
            let tBuff = message.mentions.users.first();
            if (tBuff && players.has(tBuff.id)) { players.get(tBuff.id).level += 10; players.get(tBuff.id).updateStats(); message.reply("👑 Đã buff 10 cấp."); }
            break;
        case 'reset':
            if (userId !== ADMIN_ID) return;
            let t = message.mentions.users.first();
            if (t && players.has(t.id)) { players.delete(t.id); message.reply(`🗑️ Đã xóa: ${t.username}`); }
            break;
    }
});

client.login(process.env.DISCORD_TOKEN);
