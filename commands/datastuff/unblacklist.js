// unblacklist.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("node:fs");
const config = require('../../data/discord/config.json')
const colors = require('../../data/handles/colors.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unblacklist")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .setDescription("Unblacklist a user")
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to unblacklist')
                .setRequired(true)
        ),
    execute: async (interaction) => {
        interaction.client.on('error', console.error);
        const user = interaction.options.getUser('user');
        const blacklistData = JSON.parse(fs.readFileSync('./data/discord/blacklist.json', 'utf8'));
        const admins = JSON.parse(fs.readFileSync('./data/discord/admins.json', 'utf8'));

        if (!admins.includes(interaction.user.id)) {
            return await interaction.reply({ embeds: [
                new EmbedBuilder()
                    .setTitle("Frosted Error")
                    .setDescription(`You don't have permission to unblacklist users.`)
                    .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                    .setThumbnail(config.embeds.footerurl)
                    .setColor(config.embeds.color)
            ] });
        }

        if (!blacklistData.includes(user.id)) {
            return await interaction.reply({ embeds: [
                new EmbedBuilder()
                    .setTitle("Frosted Error")
                    .setDescription(`User ${user.tag} is not blacklisted.`)
                    .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                    .setThumbnail(config.embeds.footerurl)
                    .setColor(config.embeds.color)
            ] });
        }

        const index = blacklistData.indexOf(user.id);
        blacklistData.splice(index, 1);
        fs.writeFileSync('./data/discord/blacklist.json', JSON.stringify(blacklistData, null, 2));

        await interaction.reply({ embeds: [
            new EmbedBuilder()
                .setTitle("Frosted Success")
                .setDescription(`User ${user.tag} has been unblacklisted.`)
                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                .setThumbnail(config.embeds.footerurl)
                .setColor(config.embeds.color)
        ] 
    });
    }
};