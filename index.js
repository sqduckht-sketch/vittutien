const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const players = new Map();
const realms = ["Luyện Khí", "Trúc Cơ", "Kết Đan", "Nguyên Anh", "Hóa Thần", "Luyện Hư", "Hợp Thể", "Độ Kiếp", "Đại Thừa"];
const ADMIN_ID = '1126092277220122634'; // Thay ID của bạn
const CHANNEL_ID = '1522097762555138089'; // Thay ID kênh thông báo
let currentBicanh = null;

class Player {
    constructor(id, name) {
        const rand = Math.random();
        this.id = id; this.name = name; this.level = 1; this.exp = 0;
        this.linhThach = 100; this.lastTrain = 0; this.wins = 0;
        this.dongPhuLevel = 1;
        this.weapon = { name: "Tay Không", atk: 0 };
        this.tuChat = rand < 0.005 ? "👑 Tiên Đế" : rand < 0.015 ? "🌟 Thánh Nhân" : "🌿 Phàm Nhân";
        this.multiplier = this.tuChat === "👑 Tiên Đế" ? 10.0 : this.tuChat === "🌟 Thánh Nhân" ? 5.0 : 1.2;
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

client.on('ready', () => {
    console.log(`Tiên giới đã khai mở!`);
    setInterval(createBicanh, 300000); 
});

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

    // Xử lý Lệnh Admin
    if (['setchat', 'adminbuff', 'reset'].includes(command)) {
        if (userId !== ADMIN_ID) return message.reply('❌ Chỉ Admin!');
        let target = message.mentions.users.first();
        if (command === 'setchat') {
            let type = parseInt(args[1]);
            const config = { 1: ["👑 Tiên Đế", 10.0], 2: ["🌟 Thánh Nhân", 5.0], 7: ["🤡 Ngu Si", 0.5] };
            if(config[type]) { pSet = players.get(target.id); pSet.tuChat = config[type][0]; pSet.multiplier = config[type][1]; pSet.updateStats(); message.reply("Đã chỉnh!"); }
        } else if (command === 'adminbuff') { players.get(target.id).level += 10; players.get(target.id).updateStats(); message.reply("Đã buff!"); }
        else if (command === 'reset') { players.delete(target.id); message.reply("Đã xóa!"); }
        return;
    }

    switch (command) {
        case 'tui':
            p.updateStats();
            message.reply(`🎒 **${p.name}**\n🔮 ${p.realm}\n⚔️ ATK: ${p.atk} (${p.weapon.name})\n💰 ${p.linhThach} LT\n🩸 Thắng: ${p.wins}\n🏠 Động Phủ: Cấp ${p.dongPhuLevel}`);
            break;
        case 'tuluyen':
            if (Date.now() - p.lastTrain < 10000) return message.reply('⚠️ Đang tĩnh tâm!');
            let gain = Math.floor((Math.random() * 16 + 15) * p.multiplier * (1 + p.dongPhuLevel * 0.2));
            p.exp += gain; p.lastTrain = Date.now();
            message.reply(`🧘‍♂️ Tu luyện tăng ${gain} EXP. Tổng: ${p.exp}/${p.level * 100}`);
            break;
        case 'thamgia':
            if (!currentBicanh) return message.reply('❌ Không có bí cảnh!');
            if (p.atk < currentBicanh.requiredAtk) return message.reply(`❌ Cần ${currentBicanh.requiredAtk} ATK.`);
            p.linhThach += currentBicanh.reward;
            if (Math.random() < 0.3) { p.weapon = { name: "Thần Kiếm", atk: 150 }; p.updateStats(); message.reply(`✨ Rơi đồ!`); }
            else message.reply(`✅ Nhận ${currentBicanh.reward} LT!`);
            currentBicanh = null;
            break;
        case 'pk':
            let target = message.mentions.users.first();
            if (!target || !players.has(target.id)) return message.reply('❌ Tag đối thủ!');
            let p2 = players.get(target.id);
            if (p.linhThach < 50 || p2.linhThach < 50) return message.reply('❌ Cần 50 LT để cược!');
            if (Math.random() * (p.atk + p2.atk) < p.atk) { p.linhThach += 50; p2.linhThach -= 50; p.wins++; message.reply(`⚔️ ${p.name} thắng!`); }
            else { p2.linhThach += 50; p.linhThach -= 50; p2.wins++; message.reply(`💀 ${p.name} thua!`); }
            break;
        case 'nangcap':
            let nCost = p.dongPhuLevel * 500;
            if (p.linhThach < nCost) return message.reply(`❌ Cần ${nCost} LT!`);
            p.linhThach -= nCost; p.dongPhuLevel++; message.reply(`🏠 Động phủ cấp ${p.dongPhuLevel}!`);
            break;
        case 'top':
            const top = [...players.values()].sort((a, b) => b.level - a.level).slice(0, 5);
            message.reply(top.map((pl, i) => `#${i + 1} ${pl.name}: ${pl.realm}`).join('\n') || 'Chưa ai!');
            break;
        case 'top_pk':
            const topPk = [...players.values()].sort((a, b) => b.wins - a.wins).slice(0, 5);
            message.reply(topPk.map((pl, i) => `#${i + 1} ${pl.name}: ${pl.wins} thắng`).join('\n') || 'Chưa ai!');
            break;
        case 'top_giaucu':
            const topRich = [...players.values()].sort((a, b) => b.linhThach - a.linhThach).slice(0, 5);
            message.reply(topRich.map((pl, i) => `#${i + 1} ${pl.name}: ${pl.linhThach} LT`).join('\n') || 'Chưa ai!');
            break;
    }
});

client.login(process.env.DISCORD_TOKEN);
