// ... (Phần khai báo và class Player giữ nguyên như code trước)

// --- Khối lệnh switch hoàn thiện ---
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
            if (Date.now() - p.lastTrain < 10000) return message.reply('⚠️ Đang tĩnh tâm, hãy chờ 10s!');
            let gain = Math.floor((Math.random() * 16 + 15) * p.multiplier);
            p.exp += gain; p.lastTrain = Date.now();
            message.reply(`🧘‍♂️ **Tu luyện thành công!**\n+ ${gain} EXP.\n✨ EXP: ${p.exp}/${p.level * 100}\n🔮 Cảnh giới: ${p.realm}`);
            break;

        case 'dotpha':
            let cost = p.level * 100;
            if (p.exp < cost) return message.reply(`❌ Cần ${cost} EXP!`);
            if (Math.random() < 0.7) { p.exp -= cost; p.level += 1; p.updateRealm(); p.updateStats(); message.reply(`🎉 Chúc mừng! Đã đột phá lên **${p.realm}**!`); }
            else { p.exp = Math.floor(p.exp * 0.8); message.reply(`💥 Đột phá thất bại! EXP còn lại: ${p.exp}`); }
            break;

        case 'thamgia':
            if (!currentBicanh) return message.reply('❌ Hiện không có bí cảnh nào!');
            if (p.atk < currentBicanh.requiredAtk) return message.reply(`❌ Lực chiến không đủ! Cần ${currentBicanh.requiredAtk} ATK.`);
            let msg = `🎉 Vượt bí cảnh **${currentBicanh.diff}**, nhận ${currentBicanh.reward} LT!`;
            if (Math.random() < 0.3) {
                const w = [{name: "Gậy Gỗ", atk: 20}, {name: "Kiếm Sắt", atk: 50}, {name: "Thần Kiếm", atk: 150}];
                p.weapon = w[Math.floor(Math.random() * w.length)];
                p.updateStats();
                msg += `\n✨ **Cơ duyên:** Nhận được **${p.weapon.name}** (+${p.weapon.atk} ATK)!`;
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
            if (!tBuff || !players.has(tBuff.id)) return;
            players.get(tBuff.id).level += 10; players.get(tBuff.id).updateStats(); message.reply(`👑 Đã buff 10 cấp cho ${tBuff.username}`);
            break;

        case 'reset':
            if (userId !== ADMIN_ID) return;
            let t = message.mentions.users.first();
            if (t && players.has(t.id)) { players.delete(t.id); message.reply(`🗑️ Đã xóa: ${t.username}`); }
            break;
    }
// ...
