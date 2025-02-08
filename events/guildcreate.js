const { ChannelType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const colors = require('../data/handles/colors.js');
const config = require('../data/discord/config.json');
module.exports = {
  name: 'guildCreate',
  async execute(guild) {
    const guildName = guild.name;
    const guildId = guild.id;
    const owner = await guild.fetchOwner();
    const memberCount = guild.memberCount;

    const logchannel = guild.client.channels.cache.get(config.logging.guildcreate);

    if (logchannel && logchannel.type === ChannelType.GuildText) {
      const defult = guild.channels.cache.find(channel => 
        channel.type === ChannelType.GuildText && channel.permissionsFor(guild.client.user).has('CREATE_INSTANT_INVITE')
      );

      if (defult) {
        const invite = await defult.createInvite({ maxAge: 0, maxUses: 0 });

        const embed = new EmbedBuilder()
          .setTitle('New Server')
          .setColor(config.embeds.color)
          .setFooter({ text: config.embeds.footer, iconURL: config.embeds.footerurl })
          .addFields(
            { name: 'Server Name', value: guildName, inline: true },
            { name: 'Server ID', value: guildId, inline: true },
            { name: 'Member Count', value: `${memberCount}`, inline: true },
            { name: 'Owner', value: `${owner.user.tag}`, inline: true },
            { name: 'Owner ID', value: `${owner.user.id}`, inline: true },
            { name: 'Invite Link', value: invite.url, inline: true }
          );

        logchannel.send({ embeds: [embed] });

        const guilds = path.join(__dirname, '..', 'data', 'handles', 'guilds.json');
        let guildsdata = [];

        if (fs.existsSync(guilds)) {
          const existingData = fs.readFileSync(guilds, 'utf8');
          guildsdata = JSON.parse(existingData);
        }

        guildsdata.push({
          guildName,
          guildId,
          memberCount,
          owner: {
            tag: owner.user.tag,
            id: owner.user.id,
          },
          inviteLink: invite.url,
        });

        fs.writeFileSync(guilds, JSON.stringify(guildsdata, null, 2));
      } else {
        console.log(`${colors.blue}[${new Date().toLocaleTimeString()}] ${colors.cyan}guild ${colors.brightCyan}>> couldnt make a invite for ${guild.name} ${colors.blue}(guild)${colors.reset}`)
      }
    } else {
      // probs got termed if your here
    }
  },
};

console.log(`${colors.blue}[${new Date().toLocaleTimeString()}] ${colors.cyan}loading ${colors.brightCyan}>> loaded guildadd file ${colors.blue}(guild)${colors.reset}`)
