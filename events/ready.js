const { ChannelType, EmbedBuilder, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const colors = require('../data/handles/colors.js');
const config = require('../data/discord/config.json');
module.exports = {
  name: 'ready',
  async execute(client) {
    console.log(`${colors.blue}[${new Date().toLocaleTimeString()}] ${colors.cyan}info ${colors.brightCyan}>> logged in as ${client.user.tag} (${client.user.id}) ${colors.blue}(ready)${colors.reset}`)
    const messages = config.status;
    let index = 0;
    setInterval(() => {
        const status = messages[index];
        client.user.setPresence({
            activities: [{ name: status, type: ActivityType.Watching }],
            status: 'dnd',
            clientStatus: { mobile: 'dnd' }
        });
        index = (index + 1) % messages.length;
    }, 10000);
  },
};
console.log(`${colors.blue}[${new Date().toLocaleTimeString()}] ${colors.cyan}loading ${colors.brightCyan}>> loaded ready file ${colors.blue}(ready)${colors.reset}`)
