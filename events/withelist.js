const { ChannelType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../data/discord/config.json');
const colors = require('../data/handles/colors.js');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember) {
    const guildId = oldMember.guild.id;

    if (guildId !== config.targetServerId) return;

    const logchannel = newMember.client.channels.cache.get(config.logging.roleupdates);
    const roleId = config.targetRoleId; 
    const whitelistPath = path.join(__dirname, '..', 'data', 'client', 'whitelist.json'); 

    const role = oldMember.guild.roles.cache.get(roleId);
    if (!role) {
      console.error(`${colors.red}[${new Date().toLocaleTimeString()}] ${colors.yellow}role ${colors.brightYellow}>> role with ID ${roleId} not found in guild ${guildId}.${colors.reset}`);
      return;
    }

    if (oldMember.roles.cache.has(roleId) && !newMember.roles.cache.has(roleId)) {
      const userId = newMember.user.id;

      let whitelist = [];
      if (fs.existsSync(whitelistPath)) {
        whitelist = JSON.parse(fs.readFileSync(whitelistPath, 'utf8'));
      }

      const userEntryIndex = whitelist.findIndex(entry => entry.userID === userId);

      if (userEntryIndex !== -1) {
        const removedRealm = whitelist[userEntryIndex];
        whitelist.splice(userEntryIndex, 1); 

        fs.writeFileSync(whitelistPath, JSON.stringify(whitelist, null, 2));

        const embed = new EmbedBuilder()
          .setTitle('Withelist Removed')
          .setColor(config.embeds.color)
          .setFooter({ text: config.embeds.footer, iconURL: config.embeds.footerurl })
          .addFields(
            { name: 'User', value: `${newMember.user.tag}`, inline: false },
            { name: 'User ID', value: userId, inline: false },
            { name: 'Realm Name', value: removedRealm.realmName, inline: false },
            { name: 'Realm ID', value: `${removedRealm.realmID}`, inline: false }
          );

        if (logchannel && logchannel.type === ChannelType.GuildText) {
          logchannel.send({ embeds: [embed] });
        }

        console.log(`${colors.blue}[${new Date().toLocaleTimeString()}] ${colors.cyan}realm ${colors.brightCyan}>> Realm "${removedRealm.realmName}" (ID: ${removedRealm.realmID}) owned by ${removedRealm.realmOwner.gamertag} was removed for user ${newMember.user.tag} (${userId}) due to boost lose${colors.reset}`);
      } else {
        console.log(`${colors.blue}[${new Date().toLocaleTimeString()}] ${colors.cyan}realm ${colors.brightCyan}>> No Realm found for user ${newMember.user.tag} (${userId}) in the whitelist.${colors.reset}`);
      }
    }
  },
};

console.log(`${colors.blue}[${new Date().toLocaleTimeString()}] ${colors.cyan}loading ${colors.brightCyan}>> loaded roleupdate file ${colors.blue}(member update)${colors.reset}`);
