    switch (command) {
        case 'help':
            const helpEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('📜 TÀNG KINH CÁC - VỊT TU TIÊN')
                .addFields(
                    { name: '⚔️ Lệnh cơ bản', value: '`!dangky`, `!tui`, `!tuluyen`, `!dotpha`, `!dao`, `!mo`, `!pk @user`, `!quay [số]`' },
                    { name: '🏆 Thông tin', value: '`!top` - Xem bảng xếp hạng' },
                    { name: '👑 Lệnh Admin', value: '`!setchat @user [1-5]`, `!adminbuff`, `!reset`' }
                );
            message.reply({ embeds: [helpEmbed] });
            break;

        case 'tui':
        case 'status':
            let expNext = p.level * 100;
            message.reply(`🎒 **${p.name}**\n🔮 ${p.realm}\n✨ Tu vi: ${p.exp}/${expNext}\n🧬 ${p.tuChat}\n💰 ${p.linhThach} LT | 💎 ${p.daThachAnh} Đá`);
            break;

        case 'top':
            const topPlayers = [...players.values()].sort((a, b) => b.level - a.level).slice(0, 5);
            const topEmbed = new EmbedBuilder().setTitle('🏆 BẢNG XẾP HẠNG TIÊN GIỚI').setColor(0xFFD700);
            topPlayers.forEach((player, i) => {
                topEmbed.addFields({ name: `#${i + 1} ${player.name}`, value: `Cấp: ${player.level} - ${player.realm}` });
            });
            message.reply({ embeds: [topEmbed] });
            break;

        case 'tuluyen':
            if (Date.now() - p.lastTrain < 10000) return message.reply('⚠️ Đang tĩnh tâm, chờ chút!');
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
            let amount = parseInt(args[2]);
            if (isNaN(amount)) return message.reply('⚠️ Cú pháp: `!adminbuff exp/lt @tên 100`');
            if (args[0] === 'exp') players.get(targetBuff.id).exp += amount;
            else players.get(targetBuff.id).linhThach += amount;
            message.reply(`👑 Đã buff ${amount} cho ${targetBuff.username}.`);
            break;
    }
