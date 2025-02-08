const { ChannelType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../data/discord/config.json');

const arasrpath = path.join(__dirname, '..', 'data', 'discord', 'arasr.json');
const colors = require('../data/handles/colors.js');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {

    if (!fs.existsSync(arasrpath)) {
      console.error('[error] arasr database not found');
      return;
    }

    const arasrusers = JSON.parse(fs.readFileSync(arasrpath, 'utf-8'));
    if (arasrusers.users.some(user => user.id === member.user.id)) {

        const guilds = path.join(__dirname, '..', 'data', 'handles', 'guilds.json');
        let guildData;
        let log = true
        if (fs.existsSync(guilds)) {
            guildData = JSON.parse(fs.readFileSync(guilds, 'utf8'));
          } else {
            console.log(`${colors.blue}[${new Date().toLocaleTimeString()}] ${colors.cyan}error ${colors.brightCyan}>> guilds file not found ${colors.blue}(guild)${colors.reset}`)
            log = false
          }
      
          const guildInfo = guildData.find(g => g.guildId === member.guild.id);
          if (!guildInfo) {
            console.log(`${colors.blue}[${new Date().toLocaleTimeString()}] ${colors.cyan}error ${colors.brightCyan}>> guild info not found ${colors.blue}(guild)${colors.reset}`)
            log = false
          }


          const logchannel = member.client.channels.cache.get(config.logging.arasralt);
 
          if (logchannel && logchannel.type === ChannelType.GuildText && log) {
            const embed = new EmbedBuilder()
              .setTitle('Arasr alt detected')
              .setColor(config.embeds.color)
              .setFooter({ text: config.embeds.footer, iconURL: config.embeds.footerurl })
              .setDescription(`<@${member.user.id}> has joined **${member.guild.name}** (${member.guild.id}) and was found in the ARASR database.`)
              .addFields(
                { name: 'User id', value: member.user.id ?? "unknown id", inline: true },
                { name: 'User name', value: member.user.name ?? "unknown name", inline: true },
                { name: 'User tag', value: member.user.tag ?? "unknown tag", inline: true },
      
                { name: 'Guild id', value: member.guild.id ?? "unknown id", inline: true },
                { name: 'Guild name', value: member.guild.name ?? "unknown name", inline: true },
                { name: 'Guild Invite', value: guildInfo.inviteLink ?? "unknown invite", inline: true }
              );
      
            logchannel.send({ embeds: [embed] });
          } else {
            if(!log){
              if (logchannel && logchannel.type === ChannelType.GuildText) {
                const embed = new EmbedBuilder()
                  .setTitle('Arasr alt detected (no guild data)')
                  .setColor(config.embeds.color)
                  .setFooter({ text: config.embeds.footer, iconURL: config.embeds.footerurl })
                  .setDescription(`<@${member.user.id}> has joined **${member.guild.name}** (${member.guild.id}) and was found in the ARASR database.`)
                  .addFields(
                    { name: 'User id', value: member.user.id ?? "unknown id", inline: true },
                    { name: 'User name', value: member.user.name ?? "unknown name", inline: true },
                    { name: 'User tag', value: member.user.tag ?? "unknown tag", inline: true },
          
                    { name: 'Guild id', value: member.guild.id ?? "unknown id", inline: true },
                    { name: 'Guild name', value: member.guild.name ?? "unknown name", inline: true },
                  );
          
                logchannel.send({ embeds: [embed] });
              }
            }
            console.log(`${colors.blue}[${new Date().toLocaleTimeString()}] ${colors.cyan}error ${colors.brightCyan}>> arasr alt detected ${colors.blue}(aras)${colors.reset}`)
          }


          console.log(`${colors.blue}[${new Date().toLocaleTimeString()}] ${colors.cyan}aras ${colors.brightCyan}>> ${member.user.tag} (${member.user.id}) joined ${member.guild.name} (${member.guild.id}) ${colors.blue}(memberadd)${colors.reset}`)

    }
  }
};

console.log(`${colors.blue}[${new Date().toLocaleTimeString()}] ${colors.cyan}loading ${colors.brightCyan}>> loaded arasrdetection file ${colors.blue}(aras)${colors.reset}`)
