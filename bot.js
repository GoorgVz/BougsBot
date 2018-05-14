const Discord = require('discord.js');
const client = new Discord.Client();
const ayarlar = require('./ayarlar.json');
const chalk = require('chalk');
const fs = require('fs');
const moment = require('moment');
const yt = require('ytdl-core');
const sql = require('sqlite');
sql.open('./score.sqlite');
require('./util/eventLoader')(client);
const prefix = '+';
const allowedUsers = ayarlar.allowedUsers;
const roles = ayarlar.roleToDisco;
const disco = new Discord.Client();



//////////////////////////////////////////////////////////////

//Bota dm atılan mesajlar
// client.on("message", message => {
//    const dmchannel = client.channels.find("name", "bota-dm");
//    if (message.channel.type === "dm") {
//        if (message.author.id === client.user.id) return;
//        dmchannel.sendMessage("", {embed: {
//                color: 3447003,
//                title: `BİR SAPIK YAKALANDI EFENDİM / DM: ${message.author.tag}`,
//                description: `BUYUR ABE: ${message.content}`
//              }})

//////////////////////////////////////////////////////////////

// reklam yasaklayan
 client.on("message", msg => {
  if (msg.content.toLowerCase().match(/(http|.com|discord.gg|discordapp.com)/g) && !msg.author.bot && msg.channel.type === "text" && msg.channel.permissionsFor(msg.guild.member(client.user)).has("MANAGE_MESSAGES")) {
     msg.delete(30).then(deletedMsg => {
       deletedMsg.reply("Reklam yapmayı kes! :warning:").catch(e => {
         console.error(e);
       });
     }).catch(e => {
       console.error(e);
     });
   }
});

//////////////////////////////////////////////////////////////

// kufur yasaklayan
// client.on("message", msg => {
//  if (msg.content.toLowerCase().match(/(annan|sikerim|sik|yaram|yarram|orosbu|orospu|orspu|orsbu|am|amcık|aneni|sikerler|Oç|öç|orrospu|Fuck|mother|fucker|Annenizi|sikerim|annenize|sokarım|sok|sokmak|sokarlar|sokarim|ibine|ibne|meme|amını|yalarım|bacını|sakso|porno|sex|seks|31|döl|dol|brazzers|porn|brazers|hub|fake|taxi|cocugu|cocukları|amını|götünü|göt|gotoş|götoş|götos|gotos|sik|sık|amk|aq|ak|mq|ameka|nah|yarrak|bandik|orta|parmak|puşt|pezewenk|pezevenk|Veled|Kudur|Zaa|Reg|amuna|çaktığım|amcık|oglu|oğlu|enay|gay|top|toppik)/g) && !msg.author.bot && msg.channel.type === "text" && msg.channel.permissionsFor(msg.guild.member(client.user)).has("MANAGE_MESSAGES")) {
//     msg.delete(30).then(deletedMsg => {
//       deletedMsg.reply("KÜFÜR Engellendi. :shield:").catch(e => {
//         console.error(e);
//       });
//     }).catch(e => {
//       console.error(e);
//     });
//   }
//});

//////////////////////////////////////////////////////////////

//fs.readdir("./komutlar/", (err, files) => {
//
//  if(err) console.log(err);
//
//  let jsfile = files.filter(f => f.split(".").pop() === "js")
//  if(jsfile.length <= 0){
//    console.log("Komut bulunamadı!");
//    return;
//  }
//
//  jsfile.forEach((f, i) =>{
//    let props = require(`./komutlar/${f}`);
//    console.log(`${f} dosyası başarıyla yüklendi!`);
//    bot.commands.set(props.help.name, props);
//  });
//
//});


/////////////////////////////////////////////////////////////////


const log = message => {
  console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] ${message}`);
};

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
fs.readdir('./komutlar/', (err, files) => {
  if (err) console.error(err);
  log(`${files.length} komut yüklenecek.`);
  files.forEach(f => {
    let props = require(`./komutlar/${f}`);
    log(`Yüklenen komut: ${props.help.name}.`);
    client.commands.set(props.help.name, props);
    props.conf.aliases.forEach(alias => {
      client.aliases.set(alias, props.help.name);
    }); 
  });
});

client.reload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e){
      reject(e);
    }
  });
};

client.load = command => {
  return new Promise((resolve, reject) => {
    try {
      let cmd = require(`./komutlar/${command}`);
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e){
      reject(e);
    }
  });
};

client.unload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      resolve();
    } catch (e){
      reject(e);
    }
  });
};

client.on('message', message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(ayarlar.prefix)) return;

  let command = message.content.split(' ')[0];
  command = command.slice(ayarlar.prefix.length);

  let args = message.content.split(' ').slice(1);

  if(command === "çevir") {
    var translate = require('node-google-translate-skidz');
    let targetLang = args[0];
    if(!targetLang) return message.channel.send(":no_entry_sign: Ne yazacağını demelisin **m!translate tr merhaba** gibi.");
    if(targetLang.length > 2) return message.channel.send(":no_entry_sign: Lütfen bir dil gir **tr, en** gibisinden.");
    var translateText = args.slice(1).join(" ");
    if(!translateText) return message.channel.send(`:no_entry_sign: Çevirmek istediğiniz "${targetLang}" dili yazın..`);

    translate({
      text: translateText,
      target: targetLang
    }, function(result) {
      var translatedText = result.translation
      const embed = new Discord.RichEmbed()
      .setAuthor(`Çeviri`, message.author.avatarURL)
      .setColor(0x47a7aa)
      .addField("Mesaj:", "**" + translateText + "**")
      .addField(`Çevrilen Mesaj: ${targetLang}`, "**" + translatedText + "**")
      .setFooter('Bougs#3639', client.user.avatarURL)
      message.channel.send({embed})
        .catch(error => message.channel.send(`Üzgünüm ${message.author.tag} Sana embed şeklinde yollayamıyorum: ${error}`))
    });
  }
})

client.on('guildCreate', guild => {
  const embed = new Discord.RichEmbed()
  .setColor(0xa447aa)
  .setTitle('Bougs moderasyon-günlüğü')
  .setDescription(`Bot, **${guild.name}** adlı sunucuya katıldı.\nToplam *${guild.memberCount}** üye.`)
  .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
  .setTimestamp()
  client.channels.get('437159314793299977').send(embed);
});

client.on('guildDelete', guild => {
  const embed = new Discord.RichEmbed()
  .setColor(0xaaa347)
  .setTitle('Bougs moderasyon-günlüğü')
  .setDescription(`Bot, **${guild.name}** adlı sunucudan ayrıldı.\nToplam *${guild.memberCount}** üye.`)
  .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
  .setTimestamp()
  client.channels.get('437159314793299977').send(embed);
});

client.on('roleCreate', role => {
  const channel = role.guild.channels.find('name', 'moderasyon-günlüğü');
  if (!channel) return role.guild.createChannel('moderasyon-günlüğü');
  if (!channel) return;
  const embed = new Discord.RichEmbed()
  .setColor(0xaaa347)
  .setTitle('Bougs')
  .setDescription(`Bir rol oluşturuldu, [**${role.name}**]`)
  .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
  .setTimestamp()
  channel.send(embed);
});

client.on('roleDelete', role => {
  const channel = role.guild.channels.find('name', 'moderasyon-günlüğü');
  if (!channel) return role.guild.createChannel('moderasyon-günlüğü');
  if (!channel) return;
  const embed = new Discord.RichEmbed()
  .setColor(0xaaa347)
  .setTitle('Bougs')
  .setDescription(`Bir rol silindi, [**${role.name}**]`)
  .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
  .setTimestamp()
  channel.send(embed);
});

client.on('channelDelete', chnnl => {
  const channel = chnnl.guild.channels.find('name', 'moderasyon-günlüğü');
  if (!channel) return;
  const embed = new Discord.RichEmbed()
  .setColor(0xaaa347)
  .setTitle('Bougs')
  .setDescription(`Bir kanal silindi, [**${chnnl.name}**]`)
  .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
  .setTimestamp()
  channel.send(embed);
});

client.on('guildMemberAdd', member => {
  member.addRole(member.guild.roles.find(r => r.name.startsWith('Kullanıcı')));
  const channel = member.guild.channels.find('name', 'gelen-giden');
  if (!channel) return;
 const embed = new Discord.RichEmbed()
 .setColor(0x79ac75)
 .setAuthor(member.user.tag, member.user.avatarURL || member.user.defaultAvatarURL)
 .setThumbnail(member.user.avatarURL || member.user.defaultAvatarURL)
 .setTitle('Sunucuya bir üye katıldı!')
 .setDescription(`Şuan da toplam, [**${member.guild.memberCount}**] üye.`)
 .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
 .setTimestamp()
 channel.send(embed);
});


client.on('guildMemberRemove', member => {
  const channel = member.guild.channels.find('name', 'gelen-giden');
  if (!channel) return;
 const embed = new Discord.RichEmbed()
 .setColor(0xac7575)
 .setAuthor(member.user.tag, member.user.avatarURL || member.user.defaultAvatarURL)
 .setThumbnail(member.user.avatarURL || member.user.defaultAvatarURL)
 .setTitle('Sunucudan bir üye ayrıldı!')
 .setDescription(`Şuan da toplam [**${member.guild.memberCount}**] üye.`)
 .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
 .setTimestamp()
 channel.send(embed);
});

//client.on('guildMemberRemove', member => {
//  const channel = member.guild.channels.find('name', 'sohbet');
//  if (!channel) return;
//	message.channel.send(`:outbox_tray: | **${member.user.tag}**, Sunucudan çıkış yaptı.`)
//});

//client.on('guildMemberAdd', member => {
//  const channel = member.guild.channels.find('name', 'sohbet');
//  if (!channel) return;
//	message.channel.send(`:inbox_tray: | **${member.user.tag}**, Sunucuya giriş yaptı.`)
//});



////////////////////////////
//client.on('message', msg => {
//  if (msg.content.toLowerCase() === 'runo') {
//    msg.reply('**RUNO DENİLİNCE HEMEN ONUN ADI GELİR, RUNO RUNO RUNO! :tada: www.Runo.biz**');
//	msg.react('🖕')
//	msg.delete();
//  }
//});
///////////////////////////


client.on('message', message => {
  const swearWords = ['http', 'https', 'discord.gg/', "www."];
  if (swearWords.some(word => message.content.toLowerCase().includes(word)) ) {
   if (!message.member.permissions.has('ADMINISTRATOR')) return message.delete();
  }
});
		

client.on('message', msg => {
  if (msg.content.toLowerCase() === 'sa') {
    setTimeout(() => {
	msg.react('🇦');
	},500);
	setTimeout(() => {
	msg.react('🇸');
	},1000);
  };

  if (msg.author.bot) return;
  if (msg.content.toLowerCase().includes('herkese günaydın')) msg.reply('**Günaydın güzel kardeşim.**');
  if (msg.content.toLowerCase().includes('günaydın')) msg.reply('**Günaydın güzel kardeşim.**');
  if (msg.content.toLowerCase().includes('iyi geceler')) msg.reply('**Sahidan iyi mi geceler?**');
  if (msg.content.toLowerCase().includes('iyi akşamlar')) msg.reply('**Eyvallah, iyi akşamlar.**');
  if (msg.content.toLowerCase().includes('selamın aleyküm')) msg.reply('**Aleyküm selam canım.**');
  if (msg.content.toLowerCase().includes('selamun aleyküm')) msg.reply('**Aleyküm selam canım.**');
  if (msg.content.toLowerCase().includes('güle güle')) msg.reply('**Güle güle ciğerim.**');
  if (msg.content.toLowerCase().includes('canım sıkkın')) msg.reply('** :smoking: Hayırdır be moruk. Kim sıktı canını? Biz buradayız anlat.**');
});

client.on('message', message => {
  if (message.author.bot) return;
  if (message.channel.type !== 'text') return;

  sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
    if (!row) {
      sql.run('INSERT INTO scores (userId, points, level) VALUES (?, ?, ?)', [message.author.id, 1, 0]);
    } else {
      let curLevel = Math.floor(0.3 * Math.sqrt(row.points + 1));
      if (curLevel > row.level) {
        row.level = curLevel;
        sql.run(`UPDATE scores SET points = ${row.points + 1}, level = ${row.level} WHERE userId = ${message.author.id}`);
        const embed = new Discord.RichEmbed()
        .setColor(0x629598)
        .setAuthor(message.author.tag, message.author.avatarURL || message.author.defaultAvatarURL)
        .setThumbnail(message.author.avatarURL || message.author.defaultAvatarURL)
        .setTitle('Tebrikler! Seviye atladın.')
        .setDescription(`İşte yeni seviyen, [**${curLevel}**]`)
		.setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
		.setTimestamp()
        message.channel.send(embed);
      }
      sql.run(`UPDATE scores SET points = ${row.points + 1} WHERE userId = ${message.author.id}`);
    }
  }).catch(() => {
    console.error;
    sql.run('CREATE TABLE IF NOT EXISTS scores (userId TEXT, points INTEGER, level INTEGER)').then(() => {
      sql.run('INSERT INTO scores (userId, points, level) VALUES (?, ?, ?)', [message.author.id, 1, 0]);
    });
  });
  

  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;
  let command = message.content.split(' ')[0];
  command = command.slice(prefix.length);
  let args = message.content.split(' ').slice(1);
  let cont = message.content.slice(prefix.length).split(' ');
  let args2 = cont.slice(1);

  if (command === 'like') {
    const embed = new Discord.RichEmbed()
    .setColor(0x47a7aa)
    .addField('==★==★==★==★===★==★==★==★==★==★==★==★', '\n░░░░░░░░░░░░░░░░░░░░░░░▄▄ \n░░░░░░░░░░░░░░░░░░░░░░█░░█ ')
	.addField('░░░░░░░░░░░░░░░░░░░░░░█░░█', '\n░░░░░░░░░░░░░░░░░░░░░█░░░█ \n░░░░░░░░░░░░░░░░░░░░█░░░░█ ')
	.addField('░░░░░░░░░░░███████▄▄█░░░░░██████▄', '\n░░░░░░░░░░░▓▓▓▓▓▓█░░░░░░░░░░░░░░█\n░░░░░░░░░░░▓▓▓▓▓▓█░░░░░░░░░░░░░░█')
	.addField('░░░░░░░░░░░▓▓▓▓▓▓█░░░░░░░░░░░░░░█', '\n░░░░░░░░░░░▓▓▓▓▓▓█░░░░░░░░░░░░░░█\n░░░░░░░░░░░▓▓▓▓▓▓█░░░░░░░░░░░░░░█')
	.addField('░░░░░░░░░░░▓▓▓▓▓▓█████░░░░░░░░░█ ', '\n░░░░░░░░░░░██████▀░░░░▀▀██████▀ ')
	.addField('◈☻◈☻◈☻◈☻◈☻◈☻◈☻◈☻◈☻◈☻◈☻◈☻◈ ', '\n░█░░░█░█░▄▀░█▀▀░░░░▀█▀░█░█░█░▄▀▀░\n░█░░░█░█▀░░░█▀░░▄▄░░█░░█▀█░█░░▀▄░')
	.addField('░█▄▄░█░█░▀▄░█▄▄░░░░░█░░█░█░█░▄▄▀░')
    message.channel.send(embed);
        };
  
  if (command === 'setpp') {
    if(message.author.id !== '437159314793299977') 
    return message.channel.send(new Discord.RichEmbed()
	.setColor(0x47a7aa)
	.setDescription(message.author.tag + ', bu komutu yalnızca yapımcım kullanabilir.'));
    if (!message.guild) {
    return message.channel.send(new Discord.RichEmbed()
	.setColor(0x47a7aa)
	.setTitle('Resim değiştir;')
	.setDescription(message.author.username + ', bu komutu direkt mesajda kullanamazsın.')); }
    const sayMessage = args.join(' ');
    if (sayMessage.length < 1) return message.channel.send(new Discord.RichEmbed()
	.setColor(0x47a7aa)
	.setTitle('Resim değiştir;')
	.setDescription(message.author.tag + ', kullanım: +resim-değiştir <bağlantı>.'));
    client.user.setAvatar(sayMessage);
    const embed = new Discord.RichEmbed()
    .setColor(0x47a7aa)
    .setDescription(message.author.tag + ', profil resmim başarıyla değiştirildi.')
    message.channel.send(embed);
        };
  if (command === 'çeviri') {
    var translate = require('node-google-translate-skidz');
    let targetLang = args[0];
    if(!targetLang) return message.channel.send(":no_entry_sign: Ne yazacağını demelisin **m!translate tr merhaba** gibi.");
    if(targetLang.length > 2) return message.channel.send(":no_entry_sign: Lütfen bir dil gir **tr, en** gibisinden.");
    var translateText = args.slice(1).join(" ");
    if(!translateText) return message.channel.send(`:no_entry_sign: Çevirmek istediğiniz "${targetLang}" dili yazın..`);

    translate({
      text: translateText,
      target: targetLang
    }, function(result) {
      var translatedText = result.translation
      const embed = new Discord.RichEmbed()
      .setAuthor(`Çeviri`, message.author.avatarURL)
      .setColor(0x00AE86)
      .addField("Mesaj:", "**" + translateText + "**")
      .addField(`Çevrilen Mesaj: ${targetLang}`, "**" + translatedText + "**")
      .setFooter(`${message.author.tag} tarafından istendi!`, client.user.avatarURL)
      message.channel.send({embed})
        .catch(error => message.channel.send(`Üzgünüm ${message.author.tag} Sana embed şeklinde yollayamıyorum: ${error}`))
    });
  }
  if (command === 'durum-değiştir') {
    if(message.author.id !== '437159314793299977') 
    return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Durum değiştir;').setDescription(message.author.tag + ', bu komutu yalnızca yapımcım kullanabilir.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
    if (!message.guild) {
    return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Durum değiştir;').setDescription(message.author.username + ', bu komutu direkt mesajda kullanamazsın.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()); }
    const sayMessage = args.join(' ');
    if (sayMessage.length < 1) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Durum değiştir;').setDescription(message.author.tag + ', kullanım: +durum-değiştir <durum>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
    client.user.setStatus(sayMessage);
    const embed = new Discord.RichEmbed()
    .setColor(0x47a7aa)
    .setTitle('Durum değiştir;')
    .setDescription(message.author.tag + ', durumum başarıyla değiştirildi.')
    .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
    .setTimestamp()
    message.channel.send(embed);
        };
  
  if (command === 'aktivite-değiştir') {
    if(message.author.id !== '437159314793299977') 
    return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Aktivite değiştir;').setDescription(message.author.tag + ', bu komutu yalnızca yapımcım kullanabilir.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
    if (!message.guild) {
    return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Aktivite deği��tir;').setDescription(message.author.username + ', bu komutu direkt mesajda kullanamazsın.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()); }
    const sayMessage = args.join(' ');
    if (sayMessage.length < 1) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Aktivite değiştir;').setDescription(message.author.tag + ', kullanım: +aktivite-değiştir <mesaj>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
    client.user.setActivity(sayMessage);
    const embed = new Discord.RichEmbed()
    .setColor(0x47a7aa)
    .setTitle('Aktivite değiştir;')
    .setDescription(message.author.tag + ', aktivitem başarıyla değiştirildi.')
    .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
    .setTimestamp()
    message.channel.send(embed);
        };
 
  if (command === 'profil' || command === 'profile') {
    if (!message.guild) {
      return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Eval;').setDescription(message.author.username + ', bu komutu direkt mesajda kullanamazsın.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()); }
    let user = message.mentions.users.first();
    if (message.mentions.users.size < 1) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Profil;').setDescription(message.author.tag + ', kullanım: +profil <@kullanıcı>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
    sql.get(`SELECT * FROM scores WHERE userId ="${user.id}"`).then(row => {
      if (!row) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Profil;').setDescription(message.author.tag + ', hiç puanı yok.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png'));
      economy.fetchBalance(user.id).then((i) => {
    const embed = new Discord.RichEmbed()
    .setColor(0x47a7aa)
    .setAuthor(user.tag, user.avatarURL || user.defaultAvatarURL)
    .setThumbnail(user.avatarURL || user.defaultAvatarURL)
    .setTitle('Profil;')
    .addField('Puan:', row.points, true)
    .addField('Seviye:', row.level, true)
    .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
    .setTimestamp()
    message.channel.send(embed);
     })
   })
        };
  
  if (command === 'yapımcı-para') {
    if(message.author.id !== '437159314793299977') 
    return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Yapımcı para;').setDescription(message.author.tag + ', bu komutu yalnızca yapımcım kullanabilir.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
      if (!message.guild) {
      return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Eval;').setDescription(message.author.username + ', bu komutu direkt mesajda kullanamazsın.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()); }
      if(message.author.id === '437159314793299977') {
    economy.updateBalance(message.author.id, parseInt(100000)).then((i) => {
      console.log('+')
    });
    } else {
    const embed = new Discord.RichEmbed()
    .setColor(0x47a7aa)
    .setTitle('Yapımcı para;')
    .setDescription(message.author.tag + ', bu komutu yalnızca yapımcım kullanabilir.')
    .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
    .setTimestamp()
    message.channel.send(embed);
   }
  }
  if (command === 'maden') {
    let sayılar = Math.floor(Math.random() * 50)
    message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('').setDescription(message.author.tag + ', maden kazma işi başladı!'))
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('').setDescription(message.author.tag + ', maden kazılıyor %25.')))
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('').setDescription(message.author.tag + ', maden kazılıyor %50.')))
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('').setDescription(message.author.tag + ', maden kazılıyor %75.')))
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('').setDescription(message.author.tag + ', maden kazılıyor %100.')))
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('').setDescription(message.author.tag + ', maden kazma işi bitti!')))
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('').setDescription(message.author.tag + ', madenden ' + sayılar + ' ₺ kazandın!')))
        };
  if (command === 'sigara') {
    let sayılar = Math.floor(Math.random() * 100)
    message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('').setDescription(message.author.tag + ', sigara yakıldı..'))
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('').setDescription(':smoking: :cloud::cloud::cloud:')))
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('').setDescription(':smoking: :cloud::cloud:')))
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('').setDescription(':smoking: :cloud:')))
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('').setDescription(':smoking: :cloud::cloud:')))
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('').setDescription(':smoking: :cloud:')))
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('').setDescription('**Sigara bitti** | **Sigara İçmeyiniz.** :no_smoking: **Sigara Sağlığa Zararlıdır..**')))
        };
		
		
		
		
		
///////////////////////
//  if (command === 'kullanıcı' || command === 'kullanıcı-bilgi') {
//    let user = message.mentions.users.first();
//    if (message.mentions.users.size < 1) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setAuthor(message.author.tag, message.author.avatarURL || message.author.defaultAvatarURL).setThumbnail(message.author.avatarURL || message.author.defaultAvatarURL).setTitle('Kullanıcı;').addField('Oyun:', message.author.presence.game ? message.author.presence.game.name : 'Oyun oynamıyor', true).addField('Kimlik:', message.author.id, true).addField('Bot:', message.author.bot ? '\n Evet' : 'Hayır', true).addField('Rolleri:', message.guild.member(message.author).roles.map(m => m.name).join(' | '), true).addField('Son gönderdiği mesaj:', message.author.lastMessage || 'Yok', true).addField('Son gönderdiği mesajın kimliği:',message.author.lastMessageID || 'Yok', true).addField('Oluşturma tarihi:', message.author.createdAt.toLocaleDateString(), true).setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
//      const embed = new Discord.RichEmbed()
//      .setColor(0x47a7aa)
//      .setAuthor(user.tag, user.avatarURL || user.defaultAvatarURL)
//      .setThumbnail(user.avatarURL || user.defaultAvatarURL)
//      .setTitle('Kullanıcı;')
//      .addField('Oyun:', user.presence.game ? user.presence.game.name : 'Oyun oynamıyor', true)
//      .addField('Kimlik:', user.id, true)
//      .addField('Bot:', user.bot ? '\n Evet' : 'Hayır', true)
//      .addField('Rolleri:', message.guild.member(user).roles.map(m => m.name).join(' | '), true)
//      .addField('Son gönderdiği mesaj:', user.lastMessage || 'Yok', true)
//      .addField('Son gönderdiği mesajın kimliği:', user.lastMessageID || 'Yok', true)
//      .addField('Oluşturma tarihi:', user.createdAt.toLocaleDateString(), true)
//      .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
//      .setTimestamp()
//      message.channel.send(embed);
//        };
////////////////////////////////////







  if (command === 'profil-resmi' || command === 'pp' || command === 'avatar') {
    let user = message.mentions.users.first();
    if (message.mentions.users.size < 1) 
	return message.channel.send(new Discord.RichEmbed()
	.setColor(0x47a7aa)
	.setImage(message.author.avatarURL || message.author.defaultAvatarURL)
	.setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
	.setTimestamp());
    const embed = new Discord.RichEmbed()
    .setColor(0x47a7aa)
    .setImage(user.avatarURL || user.defaultAvatarURL)
    .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
    .setTimestamp()
    message.channel.send(embed);
        };
  
  
////////////////////
//  if (command === 'sunucuu' || command === 'sunucu-bilgii') {
//   const emojiList = message.guild.emojis.map(e=>e.toString()).join(' ');
//    if (!message.guild) {
//    return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Sunucu;').setDescription(message.author.tag + ', bu komutu direkt mesajda kullanamazsın.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()); }
//    const embed = new Discord.RichEmbed()
//    .setColor(0x47a7aa)
//    .setAuthor(message.guild.name, message.guild.iconURL)
//    .setThumbnail(message.guild.iconURL)
//    .setTitle('Sunucu;')
//    .addField('İsim kısaltması:', message.guild.nameAcronym, true)
//    .addField('Kimliği:', message.guild.id, true)
//    .addField('Bölgesi:', message.guild.region, true)
//    .addField('Sahibi:', message.guild.owner, true)
//    .addField('Doğrulama seviyesi:', message.guild.verificationLevel, true)
//    .addField('Emojiler:', emojiList || 'Yok', true)
//    .addField('Üyeler:', `${message.guild.members.filter(member => member.user.bot).size} bot / ${message.guild.memberCount} üye`, true)
//    .addField('Varsayılan rol:', message.guild.defaultRole, true)
//    .addField('Roller:', message.guild.roles.map(role => role.name).join(' | '), true)
//    .addField('Kanallar:', `${message.guild.channels.filter(chan => chan.type === 'voice').size} sesli / ${message.guild.channels.filter(chan => chan.type === 'text').size} metin`, true)
//    .addField('Kanal sayısı:', message.guild.channels.size, true)
//    .addField('Ana kanalı:', message.guild.defaultChannel || 'Yok', true)
//    .addField('Sistem kanalı:', message.guild.generalChannel || 'Yok', true)
//    .addField('AFK kanalı:', message.guild.afkChannel || 'Yok', true)
//    .addField('AFK zaman aşımı:', message.guild.afkTimeout + ' saniye', true)
//    .addField('Oluşturma tarihi:', message.guild.createdAt.toLocaleDateString(), true)
//    .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
//    .setTimestamp()
//    message.channel.send(embed);
//        };
////////////////////
  
//////////////////////////// 
//  if (command === 'att' || command === 'kickk') {
//    if (!message.guild) {
//    return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('At;').setDescription(message.author.tag + ', bu komutu direkt mesajda kullanamazsın.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()); }
//    let guild = message.guild
//    let reason = args.slice(1).join(' ');
//    let user = message.mentions.users.first();
//    let modlog = guild.channels.find('name', 'bougs');
//    if (!modlog) return message.guild.createChannel('TheRenk');
//    if (message.mentions.users.size < 1) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('At;').setDescription(message.author.tag + ', kullanım: +at <@kullanıcı> <sebep>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
//    if (reason.length < 1) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('At;').setDescription(message.author.tag + ', kullanım: +at <@kullanıcı> sebep>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
//
//    if (!message.guild.member(user).kickable) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('At;').setDescription(message.author.tag + ', yetkilileri atamam.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
//    message.guild.member(user).kick();
//
//    const embed = new Discord.RichEmbed()
//      .setColor(0x47a7aa)
//      .setTitle('Sunucudan atıldın;')
//      .setDescription(message.guild.name + ' adlı sunucudan atıldın.')
//      .addField('Yetkili:', message.author.tag, true)
//      .addField('Sebep:', reason, true)
//      .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
//      .setTimestamp()
//    user.send(embed);
//    const embed2 = new Discord.RichEmbed()
//      .setColor(0x47a7aa)
//      .setTitle('At;')
//      .setDescription(user.tag + ' adlı kullanıcı başarıyla atıldı.')
//      .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
//      .setTimestamp()
//    message.channel.send(embed2);
//    const embed3 = new Discord.RichEmbed()
//      .setColor(0x47a7aa)
//      .setTitle('At;')
//      .addField('Kullanıcı:', user.tag, true)
//      .addField('Yetkili:', message.author.tag, true)
//      .addField('Sebep:', reason, true)
//      .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
//      .setTimestamp()
//    return guild.channels.get(modlog.id).send(embed3);
//    economy.updateBalance(message.author.id, parseInt(5)).then((i) => {
//          console.log('+')
//        });
//  }
//  if (command === 'yasaklaa' || command === 'bann') {
//    if (!message.member.permissions.has('BAN_MEMBERS')) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Yasakla;').setDescription(message.author.tag + ', bu komutu kullanmak için gerekli izinlere sahip değilsin.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
//    if (!message.guild) {
//    return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Yasakla;').setDescription(message.author.tag + ', bu komutu direkt mesajda kullanamazsın.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()); }
//    let guild = message.guild
//    let reason = args.slice(1).join(' ');
//    let user = message.mentions.users.first();
//    let modlog = guild.channels.find('name', 'bougs');
//    if (!modlog) return message.guild.createChannel('TheRenk');
//    if (message.mentions.users.size < 1) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Yasakla;').setDescription(message.author.tag + ', kullanım: +yasakla <@kullanıcı> <sebep>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
//    if (reason.length < 1) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Yasakla;').setDescription(message.author.tag + ', kullanım: +yasakla <@kullanıcı> <sebep>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
//
//    if (!message.guild.member(user).bannable) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Yasakla;').setDescription(message.author.tag + ', yetkilileri yasaklayamam.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
//    message.guild.ban(user, 2);
//
//    const embed = new Discord.RichEmbed()
//      .setColor(0x47a7aa)
//      .setTitle('Sunucudan yasaklandın;')
//      .setDescription(message.guild.name + ' adlı sunucudan yasaklandın.')
//      .addField('Yetkili:', `${message.author.tag}`, true)
//      .addField('Sebep:', reason, true)
//      .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
//      .setTimestamp()
//    user.send(embed);
//    const embed2 = new Discord.RichEmbed()
//      .setColor(0x47a7aa)
//      .setTitle('Yasakla;')
//      .setDescription(user.tag + ' adlı kullanıcı başarıyla yasaklandı.')
//      .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
//      .setTimestamp()
//    message.channel.send(embed2);
//    const embed3 = new Discord.RichEmbed()
//      .setColor(0x47a7aa)
//      .setTitle('Yasakla;')
//      .addField('Kullanıcı:', `${user.tag}`, true)
//      .addField('Yetkili:', `${message.author.tag}`, true)
//      .addField('Sebep:', reason, true)
//      .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
//      .setTimestamp()
//    return guild.channels.get(modlog.id).send(embed3);
//    economy.updateBalance(message.author.id, parseInt(5)).then((i) => {
//          console.log('+')
//        });
//  }
//  if (command === 'uyar') {
//    if (!message.member.permissions.has('KICK_MEMBERS')) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Uyar;').setDescription(message.author.tag + ', bu komutu kullanmak için gerekli izinlere sahip değilsin.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
//    if (!message.guild) {
//    return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Uyar;').setDescription(message.author.tag + ', bu komutu direkt mesajda kullanamazsın.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()); }
//      let guild = message.guild
//      let reason = args.slice(1).join(' ');
//      let user = message.mentions.users.first();
//      let modlog = guild.channels.find('name', 'bougs');
//      if (!modlog) return message.guild.createChannel('TheRenk');
//      if (message.mentions.users.size < 1) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Uyar;').setDescription(message.author.tag + ', kullanım: +uyar <@kullanıcı> <sebep>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
//      if (reason.length < 1) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Uyar;').setDescription(message.author.tag + ', kullanım: +uyar <@kullanıcı> <sebep>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
//
//      const embed = new Discord.RichEmbed()
//        .setColor(0x47a7aa)
//        .setTitle('Sunucuda uyarıldın;')
//        .setDescription(message.guild.name + ' adlı sunucuda uyarıldın.')
//        .addField('Yetkili:', message.author.tag, true)
//        .addField('Sebep:', reason, true)
//        .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
//        .setTimestamp()
//      user.send(embed);
//      const embed2 = new Discord.RichEmbed()
//        .setColor(0x47a7aa)
//        .setTitle('Uyar;')
//        .setDescription(user.tag + ' adlı kullanıcı başarıyla uyarıldı.')
//        .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
//        .setTimestamp()
//      message.channel.send(embed2);
//      const embed3 = new Discord.RichEmbed()
//        .setColor(0x47a7aa)
//        .setTitle('Uyar;')
//        .addField('Kullanıcı:', user.tag, true)
//        .addField('Yetkili:', message.author.tag, true)
//        .addField('Sebep:', reason, true)
//        .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
//        .setTimestamp()
//      return guild.channels.get(modlog.id).send(embed3)
//        };
//  
//  if (command === 'sil') {
//    if (!message.member.permissions.has('MANAGE_MESSAGES')) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Sil;').setDescription(message.author.tag + ', bu komutu kullanmak için gerekli izinlere sahip değilsin.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
//    if (!message.guild) {
//    return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Sil;').setDescription(message.author.tag + ', bu komutu direkt mesajda kullanamazsın.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()); }
//    let guild = message.guild
//    let modlog = guild.channels.find('name', 'bougs');
//    if (!modlog) return message.guild.createChannel('TheRenk');
//    let mesajsayisi = parseInt(args.join(' '));
//    let mesaj = args.slice(0).join(' ');
//    if (mesaj.length < 1) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Sil;').setDescription(message.author.tag + ', kullanım: +sil <sayı>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
//    if (mesajsayisi > 100) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Sil;').setDescription(message.author.tag + ', 100 adetden fazla mesaj silemem.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
//    message.channel.bulkDelete(mesajsayisi + 1);
//    const embed = new Discord.RichEmbed()
//      .setColor(0x47a7aa)
//      .setTitle('Sil;')
//      .setDescription(message.author.tag + ', mesajları başarıyla sildim.')
//      .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
//      .setTimestamp()
//    message.channel.send(embed);
//    const embed2 = new Discord.RichEmbed()
//      .setColor(0x47a7aa)
//      .setTitle('Sil;')
//      .addField('Yetkili:', message.author.tag, true)
//      .addField('Kanal:', message.channel.name, true)
//      .addField('Mesaj sayısı:', mesajsayisi, true)
//      .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
//      .setTimestamp()
//    return guild.channels.get(modlog.id).send(embed2)
//    message.delete()
//        };
///////////////////////////
  
  if (command === 'sunucu-adı-değiştir') {
    if (!message.member.permissions.has('ADMINISTRATOR')) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Sunucu adı değiştir;').setDescription(message.author.tag + ', bu komutu kullanmak için gerekli izinlere sahip değilsin.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
    if (!message.guild) {
    return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Sunucu adı değiştir;').setDescription(message.author.tag + ', bu komutu direkt mesajda kullanamazsın.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()); }
    const sayMessage = args.join(' ');
    if (sayMessage.length < 1) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Sunucu adı değiştir;').setDescription(message.author.tag + ', kullanım: +sunucu-adı-değiştir <mesaj>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
    message.guild.setName(sayMessage);
    const embed = new Discord.RichEmbed()
    .setColor(0x47a7aa)
    .setTitle('Sunucu adı değiştir;')
    .setDescription(message.author.tag + ', sunucu adı başarıyla değiştirildi.')
    .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
    .setTimestamp()
    message.channel.send(embed);
    economy.updateBalance(message.author.id, parseInt(5)).then((i) => {
          console.log('+')
        });
  }
  if (command === 'sunucu-resmi-değiştir') {
    if (!message.member.permissions.has('ADMINISTRATOR')) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Sunucu resmi değiştir;').setDescription(message.author.tag + ', bu komutu kullanmak için gerekli izinlere sahip değilsin.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
    if (!message.guild) {
    return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Sunucu resmi değiştir;').setDescription(message.author.tag + ', bu komutu direkt mesajda kullanamazsın.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()); }
    const sayMessage = args.join(' ');
    if (sayMessage.length < 1) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Sunucu resmi değiştir;').setDescription(message.author.tag + ', kullanım: +sunucu-resmi-değiştir <bağlantı>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
    message.guild.setIcon(sayMessage);
    const embed = new Discord.RichEmbed()
    .setColor(0x47a7aa)
    .setTitle('Sunucu resmi değiştir;')
    .setDescription(message.author.tag + ', sunucu resmi başarıyla değiştirildi.')
    .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
    .setTimestamp()
    message.channel.send(embed);
    economy.updateBalance(message.author.id, parseInt(5)).then((i) => {
          console.log('+')
        });
  }
  if (command === 'kanal-aç') {
    if (!message.member.permissions.has('ADMINISTRATOR')) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Kanal aç;').setDescription(message.author.tag + ', bu komutu kullanmak için gerekli izinlere sahip değilsin.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
    if (!message.guild) {
    return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Kanal aç;').setDescription(message.author.tag + ', bu komutu direkt mesajda kullanamazsın.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()); }
    let mesaj = args.slice(0).join(' ');
    if (mesaj.length < 1) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Kanal aç;').setDescription(message.author.tag + ', kullanım: +kanal-aç <mesaj>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
    const channel = message.guild.createChannel(mesaj);
    economy.updateBalance(message.author.id, parseInt(5)).then((i) => {
          console.log('+')
        });
  }
  if (command === 'rol-oluştur') {
    if (!message.member.permissions.has('ADMINISTRATOR')) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Rol oluştur;').setDescription(message.author.tag + ', bu komutu kullanmak için gerekli izinlere sahip değilsin.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
    if (!message.guild) {
    return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Rol oluştur;').setDescription(message.author.tag + ', bu komutu direkt mesajda kullanamazsın.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()); }
    const sayMessage = args.join(' ');
    if (sayMessage.length < 1) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Rol oluştur;').setDescription(message.author.tag + ', kullanım: +rol-oluştur <mesaj>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
    message.guild.createRole({
                    name: sayMessage,
                    color: "#FF4000",
                    permission:[]
            });
    const embed = new Discord.RichEmbed()
     .setColor(0x47a7aa)
     .setTitle('Rol oluştur;')
     .setDescription(`Başarıyla rol oluşturdum!`)
     .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
     .setTimestamp()
     message.channel.send(embed);
     economy.updateBalance(message.author.id, parseInt(5)).then((i) => {
          console.log('+')
        });
  }
  if(command === 'mc-sunucu') {
    const IPhere = args.join(' ');
    if (IPhere.length < 1) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Minecraft sunucu;').setDescription(message.author.tag + ', kullanım: +mc-sunucu <sunucu IP>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
    var request = require('request');
      request('https://api.mcsrvstat.us/1/' + IPhere, function (error, response, body) {
      if(error) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Minecraft sunucu;').setDescription(message.author.tag + ', bir şeyler ters gitti.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());

      var bodyJSON = JSON.parse(body)
      if(bodyJSON.debug.ping !== true) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Minecraft sunucu;').setDescription(message.author.tag + ', bu sunucu kapalı.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
      var serverIP = bodyJSON.ip
      var serverPort = bodyJSON.port
      var motd1 = bodyJSON.motd.clean[0]
      var motd2 = bodyJSON.motd.clean[1]
      if(!motd2){ 
        var motd2 = "No second line.";
      }
      var version = bodyJSON.version
      var onlinePlayers = bodyJSON.players.online
      var maxPlayers = bodyJSON.players.max
      const embed = new Discord.RichEmbed()
        .setColor(0x47a7aa)
        .setTitle(motd1)
        .addField('Sunucu IP:', `${serverIP}:${serverPort}`, true)
        .addField('Sürüm:', version, true)
        .addField('Açıklama:', `${motd1}\n${motd2}`)
        .addField('Oyuncular (çevrimiçi/toplam):', `${onlinePlayers}/${maxPlayers}`, true)
        .setFooter('Minecraft sunucu', client.user.avatarURL)
        .setTimestamp()
        message.channel.send({embed})
        .catch(error => message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Minecraft sunucu;').setDescription(message.author.tag + ', bir şeyler ters gitti.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()));
    });
  }
  
  if (command === 'kısalt') {
    if (!args[0]) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Kısalt;').setDescription(message.author.tag + ', kullanım: +kısalt <bağlantı>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
      if (!args[1]) {
        shorten.shorten(args[0], function(res) {
          message.channel.send(res);
        })
      } else {
        shorten.custom(args[0], args[1], function(res) {
          if (res.startsWith('Error')) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Kısalt;').setDescription(res).setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
          message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Kısalt;').setDescription(`<${res}>`).setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
        })
      }
  }
  if (command === 'müzik-ara') {
    let mesaj = args.slice(0).join(' ');
    if (mesaj.length < 1) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Müzik ara;').setDescription(message.author.tag + ', kullanım: +müzik-ara <mesaj>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
    genius.search(args.join(' '))
    .then(function(results) {
    return results[0]
      })
      .then(function(result) {
      const embed = new Discord.RichEmbed()
                .setColor(0x47a7aa)
                .setTitle('Müzik ara;')
                .addField('Müzik adı:', result.title, true)
                .addField('Sanatçı:', result.artist, true)
                .addField('Sözler:', '[Genius]('+result.url+')', true)
                .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
                .setTimestamp()
                message.channel.send(embed);
        });
  }
  if (command === 'youtube') {
    let mesaj = args.slice(0).join(' ');
    if (mesaj.length < 1) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('YouTube;').setDescription(message.author.tag + ', kullanım: +youtube <mesaj>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
   message.channel.send('', {
    embed: {
      type: 'rich',
      title: 'YouTube',
      description: '[' + args.toString().replace(/,/g, ' ') + '](https://www.youtube.com/results?search_query=' + args.toString().replace(/,/g, '+') + ')',
      color: 0xff4000
    }
        });
  }
  if (command === 'twitter') {
    let mesaj = args.slice(0).join(' ');
    if (mesaj.length < 1) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Twitter;').setDescription(message.author.tag + ', kullanım: +twitter <mesaj>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
   message.channel.send('', {
    embed: {
      type: 'rich',
      title: 'Twitter',
      description: '[' + args.toString().replace(/,/g, ' ') + '](https://twitter.com/search?q=' + args.toString().replace(/,/g, '%20') + ')',
      color: 0xff4000
    }
   })
        };
  
  if (command === 'google') {
    let mesaj = args.slice(0).join(' ');
    if (mesaj.length < 1) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Twitter;').setDescription(message.author.tag + ', kullanım: +twitter <mesaj>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
   message.channel.send('', {
    embed: {
      type: 'rich',
      title: 'Google',
      description: '[' + args.toString().replace(/,/g, ' ') + '](https://google.com/search?q=' + args.toString().replace(/,/g, '%20') + ')',
      color: 0xff4000
    }
   })
        };
  
  if (command === 'instagram') {
    let mesaj = args.slice(0).join(' ');
    if (mesaj.length < 1) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Twitter;').setDescription(message.author.tag + ', kullanım: +twitter <mesaj>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
   message.channel.send('', {
    embed: {
      type: 'rich',
      title: 'İnstagram',
      description: '[' + args.toString().replace(/,/g, ' ') + '](https://instagram.com/' + args.toString().replace(/,/g, '%20') + ')',
      color: 0xff4000
    }
   })
        };
  
  if (command === 'github') {
    let mesaj = args.slice(0).join(' ');
    if (mesaj.length < 1) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('GitHub;').setDescription(message.author.tag + ', kullanım: +github <mesaj>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
   message.channel.send('', {
    embed: {
      type: 'rich',
      title: 'GitHub',
      description: '[' + args.toString().replace(/,/g, ' ') + '](https://github.com/search?q=' + args.toString().replace(/,/g, '+') + ')',
      color: 0xff4000
    }
   })
        };
  
  if (command === 'discord-bots') {
    let mesaj = args.slice(0).join(' ');
    if (mesaj.length < 1) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Twitter;').setDescription(message.author.tag + ', kullanım: +twitter <mesaj>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
   message.channel.send('', {
    embed: {
      type: 'rich',
      title: 'Discord Bots',
      description: '[' + args.toString().replace(/,/g, ' ') + '](https://discordbots.org/search?q=' + args.toString().replace(/,/g, '%20') + ')',
      color: 0xff4000
    }
   })
        };
  
    if (command === 'facebook') {
    let mesaj = args.slice(0).join(' ');
    if (mesaj.length < 1) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Twitter;').setDescription(message.author.tag + ', kullanım: +twitter <mesaj>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
   message.channel.send('', {
    embed: {
      type: 'rich',
      title: 'Facebook',
      description: '[' + args.toString().replace(/,/g, ' ') + '](https://facebook.com/search/top/?q=' + args.toString().replace(/,/g, '%20') + ')',
      color: 0xff4000
    }
   })
        };
  

  if (command === '1v1') {
    if (!message.guild) {
      return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Eval;').setDescription(message.author.username + ', bu komutu direkt mesajda kullanamazsın.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()); }
    let user = message.mentions.users.first();
    if (message.mentions.users.size < 2) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('2v2;').setDescription(message.author.tag + ', kullanım: +2v2 <@kullanıcı> <@kullanıcı>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
      message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('2v2;').setDescription('Savaş başladı!').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp())
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('2v2;').setDescription('Savaşılıyor %25.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()))
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('2v2;').setDescription('Savaşılıyor %50.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()))
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('2v2;').setDescription('Savaşılıyor %75.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()))
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('2v2;').setDescription('Savaşılıyor %100.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()))
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('2v2;').setDescription('Savaş bitti!').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()))
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('2v2;').setDescription('Kazanan: ' + user.tag).setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()));
        };
  
  if (command === '2v2') {
    if (!message.guild) {
      return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Eval;').setDescription(message.author.username + ', bu komutu direkt mesajda kullanamazsın.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()); }
    let user = message.mentions.users.first();
    if (message.mentions.users.size < 3) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('3v3;').setDescription(message.author.tag + ', kullanım: +3v3 <@kullanıcı> <@kullanıcı> <@kullanıcı>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
      message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('3v3;').setDescription('Savaş başladı!').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp())
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('3v3;').setDescription('Savaşılıyor %25.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()))
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('3v3;').setDescription('Savaşılıyor %50.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()))
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('3v3;').setDescription('Savaşılıyor %75.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()))
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('3v3;').setDescription('Savaşılıyor %100.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()))
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('3v3;').setDescription('Savaş bitti!').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()))
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('3v3;').setDescription('Kazanan: ' + user.tag).setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()))
        };
  
  if (command === '4v4') {
    if (!message.guild) {
      return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Eval;').setDescription(message.author.username + ', bu komutu direkt mesajda kullanamazsın.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()); }
    let user = message.mentions.users.first();
    if (message.mentions.users.size < 4) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('4v4;').setDescription(message.author.tag + ', kullanım: +4v4 <@kullanıcı> <@kullanıcı> <@kulanıcı> <@kullanıcı>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
      message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('4v4;').setDescription('Savaş başladı!').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp())
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('4v4;').setDescription('Savaşılıyor %25.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()))
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('4v4;').setDescription('Savaşılıyor %50.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()))
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('4v4;').setDescription('Savaşılıyor %75.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()))
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('4v4;').setDescription('Savaşılıyor %100.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()))
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('4v4;').setDescription('Savaş bitti!').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()))
      .then(nmsg => nmsg.edit(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('4v4;').setDescription('Kazanan: ' + user.tag).setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()))
        };
  
  if (command === 'sunucu-davet') {
    if (!message.guild) {
      return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Eval;').setDescription(message.author.username + ', bu komutu direkt mesajda kullanamazsın.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()); }
    message.guild.channels.get(message.channel.id).createInvite().then(invite =>
    message.channel.send('Bu sunucunun davet bağlantısı;\n' + invite.url)
   );
    economy.updateBalance(message.author.id, parseInt(5)).then((i) => {
          console.log('+')
        });
  }
  if (command === 'reklam-kontrol') {
    if (!message.guild) {
      return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Eval;').setDescription(message.author.username + ', bu komutu direkt mesajda kullanamazsın.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()); }
    const members = message.guild.members.filter(member => member.user.presence.game && /(discord\.(gg|io|me|li)\/.+|discordapp\.com\/invite\/.+)/i.test(member.user.presence.game.name))
    return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Reklam kontrol;').setDescription(members.map(member => member.displayName + ' adlı kullanıcının aktivite kısmında sunucu bağlantısı var.').join('\n') || message.author.username + ', kimse aktivite kısmına sunucu bağlantısı koymamış.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());

        };
  
  if (command === 'öneri') {
    let type = args.slice(0).join(' ');
        if (type.length < 1) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Tavsiye;').setDescription(message.author.tag + ', kullanım: +tavsiye <mesaj>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
    const embed = new Discord.RichEmbed()
    .setColor(0x47a7aa)
    .setTitle('Tavsiye;')
    .setDescription(message.author.tag + ', tavsiyeniz başarıyla gönderildi.')
    .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
    .setTimestamp()
    message.channel.send(embed);
    const embed2 = new Discord.RichEmbed()
    .setColor(0x47a7aa)
    .setTitle('Tavsiye;')
    .addField('Tavsiye:', type, true)
    .addField('Kullanıcı:', message.author.tag, true)
    .addField('Sunucu:', message.guild.name, true)
    .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
    .setTimestamp()
    client.channels.get('434478811174797313').send(embed2);
  }
  if (command === 'hata' || command === 'bug') {
    let type = args.slice(0).join(' ');
        if (type.length < 1) return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Hata;').setDescription(message.author.tag + ', kullanım: +hata <mesaj>.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp());
    const embed = new Discord.RichEmbed()
    .setColor(0x47a7aa)
    .setTitle('Hata;')
    .setDescription(message.author.tag + ', hatanız başarıyla gönderildi.')
    .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
    .setTimestamp()
    message.channel.send(embed);
    const embed2 = new Discord.RichEmbed()
    .setColor(0x47a7aa)
    .setTitle('Hata;')
    .addField('Hata:', type, true)
    .addField('Kullanıcı:', message.author.tag, true)
    .addField('Sunucu:', message.guild.name, true)
    .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
    .setTimestamp()
    client.channels.get('434478811174797313').send(embed2);
        };
  
  if (command === 'oyun-öneri') {
    var cumleler= ['Grand Theft Auto', 'Minecraft', 'ROBLOX', 'Unturned', 'Creativerse', 'Prototype', 'Call of Duty', 'Zula', 'PLAYERUNKNOWNS BATTLEGROUNDS', 'League of Legends', 'Growtopia', 'Team Fortress', 'Counter-Strike', 'Garrys Mod', 'Black Desert Online', 'Rocket Leauge', 'Warframe', 'Battlefield', 'Half-Life', 'Rust', 'H1Z1', 'Fortnite', 'Overwatch', 'World of Tanks'];
    var cumle = cumleler[Math.floor(Math.random() * cumleler.length)];
    const embed = new Discord.RichEmbed()
    .setColor(0x47a7aa)
    .setTitle('Oyun öneri;')
    .setDescription(cumle)
    .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
    .setTimestamp()
    message.channel.send(embed);
        };
  
  if (command === 'espri' || command === 'espiri') {
    var espriler = ['Seni görünce; \ngözlerim dolar, \nkulaklarım euro.','Gidenin arkasına bakmayın yoksa geleni göremezsiniz.','+Oğlum canlılara örnek ver. \n-Kedi, köpek. \n+Cansızlara örnek ver. \n-Ölü kedi, ölü köpek.','+Kanka ben banyoya 3 kişi giriyorum. \n-Oha nasıl? \n+Hacı, Şakir ve ben. \n-Defol lan!','+Kocanızla ortak özelliğiniz ne? \n-Aynı gün evlendik.','+Evladım ödevini neden yapmadın? \n-Bilgisayarım uyku modundaydı, uyandırmaya kıyamadım.','+Bizim arkadaş ortamında paranın lafı bile olmaz. \n-Niye ki? \n+Çünkü hiç birimizin parası yok.','Annemin bahsettiği elalem diye bir örgüt var illuminatiden daha tehlikeli yemin ederim.','+Acıkan var mı ya? \n-Yok bizde tatlı kan var.','Yılanlardan korkma, yılmayanlardan kork.','+Baykuşlar vedalaşırken ne der? \n-Bay bay baykuş.','Beni Ayda bir sinemaya götürme, Marsta bir sinemaya götür.','Aaa siz çok terlemişsiniz durun size terlik getireyim.','Aklımı kaçırdım, 100.000 TL fidye istiyorum.'];
    var espri = espriler[Math.floor(Math.random() * espriler.length)];
    const embed = new Discord.RichEmbed()
    .setColor(0x47a7aa)
    .setTitle('Espri;')
    .setDescription(espri)
    .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
    .setTimestamp()
    message.channel.send(embed);
        };
  
  if (command === 'rastgele-sayı') {
    let sayılar = Math.floor(Math.random() * 100)
    const embed = new Discord.RichEmbed()
    .setColor(0x47a7aa)
    .setTitle('Rastgele sayı;')
    .setDescription(sayılar)
    .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
    .setTimestamp()
    message.channel.send(embed);
        };
  
  if (command === 'rastgele-kullanıcı') {
    if (!message.guild) {
    return message.channel.send(new Discord.RichEmbed().setColor(0x47a7aa).setTitle('Rastgele kullanıcı;').setDescription(message.author.username + ', bu komutu direkt mesajda kullanamazsın.').setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png').setTimestamp()); }
    const embed = new Discord.RichEmbed()
    .setColor(0x47a7aa)
    .setTitle('Rastgele kullanıcı;')
    .setDescription(message.guild.members.random().displayName)
    .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
    .setTimestamp()
    message.channel.send(embed);
    economy.updateBalance(message.author.id, parseInt(5)).then((i) => {
          console.log('+')
        });
  }
  if (command === 'yazı-tura' || command === 'yazıtura') {
    var result = Math.floor((Math.random() * 2) + 1);
    if (result == 1) {
      const embed = new Discord.RichEmbed()
      .setColor(0x47a7aa)
      .setTitle('Yazı mı? Tura mı?')
      .setDescription('Tura.')
      .setImage('https://images-ext-2.discordapp.net/external/3z8YPrDT2pG5dZKQa24-GRRlDcpAVg_rCGStycwzdxs/https/cdn.discordapp.com/attachments/358322476167462914/366966718486282240/1TL_reverse.png')
      .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
      .setTimestamp()
      message.channel.send(embed);
    } else if (result == 2) {
      const embed = new Discord.RichEmbed()
      .setColor(0x47a7aa)
      .setTitle('Yazı mı? Tura mı?')
      .setDescription('Yazı.')
      .setImage('https://images-ext-1.discordapp.net/external/xHioyMCli8-Tdth3BUGXZMoqEBMeIPdCrwNc9OJj8J0/https/cdn.discordapp.com/attachments/358322476167462914/366966782252023808/1503472_o8efa.png')
      .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
      .setTimestamp()
      message.channel.send(embed);
    }
        };
		
		
  if (command === 'köpek' || command === 'kopek') {
    var result = Math.floor((Math.random() * 8) + 1);
    if (result == 1) {
      const embed = new Discord.RichEmbed()
      .setColor(0x47a7aa)
      .setImage('https://cdn.pixabay.com/photo/2017/05/02/23/32/golden-retriever-2279660_960_720.jpg')
      message.channel.send(embed);
    } else if (result == 2) {
      const embed = new Discord.RichEmbed()
      .setColor(0x47a7aa)
      .setImage('https://nelazimsa.carrefoursa.com/wp-content/uploads/2017/08/dunya-kopek-gunu.jpg')
      message.channel.send(embed);
	} else if (result == 3) {
      const embed = new Discord.RichEmbed()
      .setColor(0x47a7aa)
      .setImage('https://www.patiliyo.com/wp-content/uploads/2017/07/köpeklerde-hastalik-belirtileri4.jpg')
      message.channel.send(embed);
	} else if (result == 4) {
      const embed = new Discord.RichEmbed()
      .setColor(0x47a7aa)
      .setImage('http://www.kadinvekadin.net/modul/user/fuimg/201607/14674447560.74046000.jpg')
      message.channel.send(embed);
	} else if (result == 5) {
      const embed = new Discord.RichEmbed()
      .setColor(0x47a7aa)
      .setImage('https://guzelresimler.info/content/photos/5892/bi/hayvanlaralemi_1339666746171.jpg')
      message.channel.send(embed);
	} else if (result == 6) {
      const embed = new Discord.RichEmbed()
      .setColor(0x47a7aa)
      .setImage('https://i.ytimg.com/vi/wCyCsT8Swio/hqdefault.jpg')
      message.channel.send(embed);
	} else if (result == 7) {
      const embed = new Discord.RichEmbed()
      .setColor(0x47a7aa)
      .setImage('https://img-s1.onedio.com/id-53c192adaa1cf6461479f5e8/rev-0/w-635/listing/f-jpg-webp/s-6f62429042522cbe7e2bc0c89fb0429fa81ffefc.webp')
      message.channel.send(embed);
	} else if (result == 8) {
      const embed = new Discord.RichEmbed()
      .setColor(0x47a7aa)
      .setImage('https://www.google.com.tr/url?sa=i&source=images&cd=&cad=rja&uact=8&ved=2ahUKEwiduqXUzIPbAhVQb1AKHfu9D8AQjRx6BAgBEAU&url=http%3A%2F%2Fconfirmado.com.ve%2Flos-5-animales-mas-populares-de-las-redes-sociales%2F&psig=AOvVaw1bOD9FT5Sylt0reoSS70_E&ust=1526332135251115')
      message.channel.send(embed);
    }
        };
		
		
		
  
  if (command === 'taş-kağıt-makas' || command === 'tkm') {
    var cumleler= ['Taş.', 'Kağıt.', 'Makas.'];
    var cumle = cumleler[Math.floor(Math.random() * cumleler.length)];
    const embed = new Discord.RichEmbed()
    .setColor(0x47a7aa)
    .setTitle('Taş kağıt makas, hangisi?')
    .setDescription(cumle)
    .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
    .setTimestamp()
    message.channel.send(embed);
        };
  
  if (command === 'topla') {
    let mesaj = args.slice(0).join(' ');
    if (mesaj.length < 1) return message.channel.send(new Discord.RichEmbed()
	.setColor(0x47a7aa)
	.setTitle(message.author.username, message.author.avatarURL)
	.setDescription(message.author.tag + ', doğru kullanım [**+topla <sayı> <sayı>**]')
	.setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
	.setTimestamp());
    let numArray = args.map(n=> parseInt(n));
    let total = numArray.reduce( (p, c) => p+c);
    const embed = new Discord.RichEmbed()
    .setColor(0x47a7aa)
    .setTitle('Toplama işleminin sonucu')
    .setDescription(total || message.author.tag + ', harfler yerine sayılar yaz.')
    .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
    .setTimestamp()
    message.channel.send(embed);
    economy.updateBalance(message.author.id, parseInt(5)).then((i) => {
          console.log('+')
        });
  }
  if (command === 'çıkar') {
    let mesaj = args.slice(0).join(' ');
    if (mesaj.length < 1) return message.channel.send(new Discord.RichEmbed()
	.setColor(0x47a7aa)
	.setTitle(message.author.username, message.author.avatarURL)
	.setDescription(message.author.tag + ', doğru kullanım [**+çıkar <sayı> <sayı>**]')
	.setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
	.setTimestamp());
    let numArray = args.map(n=> parseInt(n));
    let total = numArray.reduce( (p, c) => p-c);
    const embed = new Discord.RichEmbed()
    .setColor(0x47a7aa)
    .setTitle('Çıkarma işleminin sonucu')
    .setDescription(total || message.author.tag + ', harfler yerine sayılar yaz.')
    .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
    .setTimestamp()
    message.channel.send(embed);
    economy.updateBalance(message.author.id, parseInt(5)).then((i) => {
          console.log('+')
        });
  }
  if (command === 'çarp') {
    let mesaj = args.slice(0).join(' ');
    if (mesaj.length < 1) return message.channel.send(new Discord.RichEmbed()
	.setColor(0x47a7aa)
	.setTitle(message.author.username, message.author.avatarURL)
	.setDescription(message.author.tag + ', doğru kullanım [**+çarp <sayı> <sayı>**]')
	.setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
	.setTimestamp());
    let numArray = args.map(n=> parseInt(n));
    let total = numArray.reduce( (p, c) => p*c);
    const embed = new Discord.RichEmbed()
    .setColor(0x47a7aa)
    .setTitle('Çarpma işleminin sonucu')
    .setDescription(total || message.author.tag + ', harfler yerine sayılar yaz.')
    .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
    .setTimestamp()
    message.channel.send(embed);
    economy.updateBalance(message.author.id, parseInt(5)).then((i) => {
          console.log('+')
        });
  }
  if (command === 'böl') {
    let mesaj = args.slice(0).join(' ');
    if (mesaj.length < 1) return message.channel.send(new Discord.RichEmbed()
	.setColor(0x47a7aa)
	.setTitle(message.author.username, message.author.avatarURL)
	.setDescription(message.author.tag + ', doğru kullanım [**+böl <sayı> <sayı>**]')
	.setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
	.setTimestamp());
    let numArray = args.map(n=> parseInt(n));
    let total = numArray.reduce( (p, c) => p/c);
    const embed = new Discord.RichEmbed()
    .setColor(0x47a7aa)
    .setTitle('Bölme işleminin sonucu')
    .setDescription(total || message.author.tag + ', harfler yerine sayılar yaz.')
    .setFooter('Bougs#3639', 'https://beeimg.com/images/t24888574272.png')
    .setTimestamp()
    message.channel.send(embed);
    economy.updateBalance(message.author.id, parseInt(5)).then((i) => {
          console.log('+')
        });
  }
});


client.elevation = message => {
  if(!message.guild) {
	return; }
  let permlvl = 0;
  if (message.member.hasPermission("BAN_MEMBERS")) permlvl = 2;
  if (message.member.hasPermission("ADMINISTRATOR")) permlvl = 3;
  if (message.author.id === ayarlar.sahip) permlvl = 4;
  if (message.author.id === ayarlar.sahip2) permlvl = 4;
  return permlvl;
};



var regToken = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;
// client.on('debug', e => {
//   console.log(chalk.bgBlue.green(e.replace(regToken, 'that was redacted')));
// });

client.on('warn', e => {
  console.log(chalk.bgYellow(e.replace(regToken, 'that was redacted')));
});

client.on('error', e => {
  console.log(chalk.bgRed(e.replace(regToken, 'that was redacted')));
});

client.login(process.env.BOT_TOKEN);
