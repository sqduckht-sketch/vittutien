// ... (Phần đầu giữ nguyên như code trước: Khai báo client, pool, Player class, getPlayer, savePlayer)

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const userId = message.author.id;

    if (command === 'dangky') {
        let p = await getPlayer(userId);
        if (p) return message.reply('❌ Đã nhập môn!');
        let newPlayer = new Player(userId, message.author.username);
        await savePlayer(newPlayer);
        return message.reply('🎉 Chào mừng gia nhập tiên giới!');
    }

    let pData = await getPlayer(userId);
    if (!pData) return message.reply('⚠️ Gõ `!dangky` trước!');
    
    // Tái tạo object để dùng các hàm sync()
    let p = Object.assign(new Player(pData.id, pData.name), pData);
    p.sync();

    // CÁC LỆNH
    switch (command) {
        case 'tui': 
            message.reply(`🎒 **${p.name}**\n🧬 ${p.tuChat}\n🔮 ${p.realm}\n⚔️ ${p.atk} ATK\n💰 ${p.linhThach} LT`); 
            break;
        case 'tuluyen': 
            if (Date.now() - p.lastTrain < 10000) return message.reply('⚠️ Đang tĩnh tâm!'); 
            p.exp += Math.floor((Math.random() * 16 + 15) * p.multiplier); 
            p.lastTrain = Date.now(); 
            await savePlayer(p); // Lưu sau khi tu luyện
            message.reply(`🧘‍♂️ **Tu luyện:** +EXP\n🔮 ${p.realm}`); 
            break;
        case 'dotpha': 
            let cost = p.level * 100; 
            if (p.exp < cost) return message.reply(`❌ Cần ${cost} EXP!`); 
            if (Math.random() < 0.7) { 
                p.exp -= cost; p.level += 1; p.sync(); 
                await savePlayer(p); // Lưu sau khi đột phá thành công
                message.reply(`🎉 Đột phá lên **${p.realm}**!`); 
            } else { 
                p.exp = Math.floor(p.exp * 0.8); 
                await savePlayer(p); // Lưu sau khi thất bại
                message.reply(`💥 Đột phá thất bại! Mất 20% EXP.`); 
            } 
            break;
        case 'nhan': 
            if (p.lastDaily && Date.now() - p.lastDaily < 86400000) return message.reply('⚠️ Mai nhận tiếp!'); 
            p.linhThach += 500; p.lastDaily = Date.now(); 
            await savePlayer(p); 
            message.reply('🎁 Nhận 500 LT!'); 
            break;
        case 'nangcap': 
            let nC = p.dongPhuLevel * 500; 
            if(p.linhThach < nC) return message.reply(`❌ Cần ${nC} LT!`); 
            p.linhThach -= nC; p.dongPhuLevel++; 
            await savePlayer(p); 
            message.reply(`🏠 Động phủ cấp ${p.dongPhuLevel}!`); 
            break;
        // Bạn có thể thêm các case còn lại (pk, top, luyenkhi...) theo cấu trúc tương tự (await savePlayer(p) sau mỗi thay đổi)
        default: message.reply('❓ Lệnh không hợp lệ!');
    }
});
