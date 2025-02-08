const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getrealminfo } = require('../../men/realms');

const databasePath = 'data/client/whitelist.json';

function loadDatabase() {
    if (fs.existsSync(databasePath)) {
        return JSON.parse(fs.readFileSync(databasePath, 'utf8'));
    }
    return []; 
}

function saveDatabase(data) {
    fs.writeFileSync(databasePath, JSON.stringify(data, null, 4));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('whitelist')
        .setDescription('Whitelist your Realm (Booster only)')
        .addStringOption(option =>
            option.setName('realmcode')
                .setDescription('The Realm Code of your Realm')
                .setRequired(true)),
    async execute(interaction) {
        const guildId = '1296633003304554536';
        const roleId = '1310689358881357886'; // staff role id

        if (interaction.guild.id !== guildId) {
            return interaction.reply({ content: 'You are not in the Support Discord.Make sure to Join discord.gg/frosted', ephemeral: true });
        }

        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!member.roles.cache.has(roleId)) {
            return interaction.reply({ content: 'Woah look like you dident have us boosted ! Go on discord.gg/frosted and Boost to Whitelist a Realm', ephemeral: true });
        }

        const realmCode = interaction.options.getString('realmcode');
        const userId = interaction.user.id;
        const realmInfo = await getrealminfo(realmCode);

        let database = loadDatabase();

        const userExists = database.some(entry => entry.userID === userId);
        if (userExists) {
            return interaction.reply({ content: 'You already got a Realm Withelisted', ephemeral: true });
        }

        database.push({
            userID: userId,
            realmName: realmInfo.name,
            realmID: realmInfo.id,
            realmOwner: realmInfo.owner,
            realmCode: realmCode,
            date: new Date().toISOString()
        });

        saveDatabase(database);

        return interaction.reply({ content: `Realm ${realmInfo.name} sussesfully withelisted`, ephemeral: true });
    }
};
