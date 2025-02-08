const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const { Authflow: PrismarineAuth, Titles } = require('prismarine-auth');
const { RealmAPI } = require('prismarine-realms');

const databasePath = './data/client/database.json';
const whitelistPath = './data/client/whitelist.json';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('codes')
        .setDescription('See how many Realm Codes we have in the Realmlist and Database.'),

    execute: async (interaction) => {
        try {
            await interaction.deferReply();

            const [databaseData, whitelistData] = await Promise.all([
                fs.readFile(databasePath, 'utf-8'),
                fs.readFile(whitelistPath, 'utf-8')
            ]);

            const database = databaseData.trim() ? JSON.parse(databaseData) : [];
            const whitelist = whitelistData.trim() ? JSON.parse(whitelistData) : [];

            const databaseCount = database.length;
            const whitelistCount = whitelist.length;

            const authflow = new PrismarineAuth(undefined, "./auth", {
                flow: "live",
                authTitle: Titles.MinecraftNintendoSwitch,
                deviceType: "Nintendo",
                doSisuAuth: true
            });
            const api = RealmAPI.from(authflow, 'bedrock');
            const realmsList = await api.getRealms();

            const realmCount = realmsList.length;
            const onlineRealms = realmsList.filter(realm => realm.state === 'OPEN').length;
            const offlineRealms = realmCount - onlineRealms;

            const embed = new EmbedBuilder()
                .setTitle('Realms Count:')
                .setDescription(
                    `Database Codes: ${databaseCount}\n` +
                    `Whitelist Codes: ${whitelistCount}\n` +
                    `Total Realms (API Acc): ${realmCount}\n` +
                    `Online Realms: ${onlineRealms}\n` +
                    `Offline Realms: ${offlineRealms}`
                )
                .setFooter({
                    text: `${interaction.user.username} | discord.gg/frosted`,
                    iconURL: interaction.user.displayAvatarURL()
                });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error responding to interaction:', error);
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Error')
                .setDescription(`An error occurred while processing your request: ${error.message}`);

            await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
    }
};
