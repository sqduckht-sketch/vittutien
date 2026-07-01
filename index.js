const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Hệ thống lưu trữ dữ liệu tu tiên tạm thời
const players = new Map();

// Hàm khởi tạo thông tin đạo hữu mới
function createPlayer(id, name) {
    return {
        id: id,
        name: name,
        level: 1,
        exp: 0,
        expNeeded: 100,
        realm: "Luyện Khí Tầng 1",
        linhThach: 10,
        lastTrain: 0
    };
}

// Danh sách các cảnh giới tu tiên
const realms = [
    "Luyện Khí", "Trúc Cơ", "Kết Đan", "Nguyên Anh", 
    "Hóa Thần", "Luyện Hư", "Hợp Thể", "Độ Kiếp", "Đại Thừa"
];

function updateRealm(player) {
    let realmIndex = Math.floor((player.level - 1) / 10);
    let subLevel = ((player.level - 1) % 10) + 1;
    if (realmIndex >= realms.length) {
        player.realm = "Tiên Nhân";
    } else {
        player.realm = `${realms[realmIndex]} Tầng ${subLevel}`;
    }
}

client.on('ready', () => {
    console.log(`Đạo hữu ${client.user.tag} đã xuất thế, bắt đầu hộ giá giới tu tiên!`);
});

client.on('messageCreate', async (message) => {
    // Bỏ qua tin nhắn của bot hoặc không bắt đầu bằng dấu lệnh "!"
    if (message.author.bot || !message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const userId = message.author.id;

    // Lấy thông tin người chơi, nếu chưa có thì tạo mới
    if (!players.has(userId)) {
        players.set(userId, createPlayer(userId, message.author.username));
    }
    let p = players.get(userId);

    // LỆNH 1: XEM TRẠNG THÁI (!status)
    if (command === 'status' || command === 'profile') {
        updateRealm(p);
        let reply = `=== **BẢNG TRẠNG THÁI ĐẠO HỮU** ===\n`;
        reply += `🔹 **Danh xưng:** ${p.name}\n`;
        reply += `🔮 **Cảnh giới:** \`${p.realm}\` (Cấp ${p.level})\n`;
        reply += `✨ **Tu vi (EXP):** ${p.exp}/${p.expNeeded}\n`;
        reply += `💰 **Linh thạch:** ${p.linhThach} viên\n`;
        reply += `===============================`;
        return message.reply(reply);
    }

    // LỆNH 2: TU LUYỆN (!tuluyen)
    if (command === 'tuluyen' || command === 'train') {
        const now = Date.now();
        const cooldown = 15000; // 15 giây hồi chiêu công pháp

        if (now - p.lastTrain < cooldown) {
            let timeLeft = Math.ceil((cooldown - (now - p.lastTrain)) / 1000);
            return message.reply(`⚠️ Đạo hữu đang bị nghẽn kinh mạch! Hãy tĩnh tọa điều khí, quay lại sau **${timeLeft} giây**.`);
        }

        // Cộng tu vi ngẫu nhiên từ 15 - 30 EXP
        let expGained = Math.floor(Math.random() * 16) + 15;
        p.exp += expGained;
        p.lastTrain = now;

        let msg = `🧘‍♂️ Đạo hữu **${p.name}** vận hành đại chu thiên, hấp thu linh khí trời đất, đột phá nhận được **+${expGained} Tu vi**! `;

        // Xử lý đột phá cấp độ
        if (p.exp >= p.expNeeded) {
            p.exp -= p.expNeeded;
            p.level += 1;
            p.expNeeded = Math.floor(p.expNeeded * 1.2); // Tăng độ khó cấp sau
            updateRealm(p);
            msg += `\n🎉 **CHÚC MỪNG!** Đạo hữu đã đột phá cảnh giới, đạt tới: \`${p.realm}\`!`;
        }

        return message.reply(msg);
    }

    // LỆNH 3: SĂN QUÁI KIẾM LINH THẠCH (!sanquai)
    if (command === 'sanquai' || command === 'hunt') {
        // Tỷ lệ 70% thắng, 30% bại
        let isWin = Math.random() > 0.3;

        if (isWin) {
            let stoneGained = Math.floor(Math.random() * 5) + 2; // Nhận 2 - 6 linh thạch
            p.linhThach += stoneGained;
            return message.reply(`⚔️ Đạo hữu vung kiếm trảm yêu thú, thu hoạch được một viên nội đan và bán được **${stoneGained} Linh thạch**!`);
        } else {
            return message.reply(`🥀 Yêu thú quá hung hãn! Đạo hữu đánh không lại, đành phải vận dụng Ngự Kiếm Phi Hành tháo chạy thục mạng, tổn hao nguyên khí.`);
        }
    }
});

// === CHỖ ĐIỀN TOKEN CỦA BẠN ===
// Hãy xóa chữ "TOKEN_CỦA_BẠN" ở dưới đi và dán mã Token Discord của bạn vào giữ hai dấu nháy đơn
client.login(process.env.DISCORD_TOKEN);


