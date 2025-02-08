const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    permission: (interaction) => true,

    data: new SlashCommandBuilder()
        .setName("getrealm")
        .setDescription('Display a random Realm Codes from the database.')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2),

    execute: async (interaction) => {
        const userId = interaction.user.id;
        const requestedCount = 3

        try {
            await displayRandomRealmCodes(interaction, requestedCount);
        } catch (error) {
            console.error('Error handling the request:', error);
            const embed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription( 'An error occurred.');
            try {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            } catch (error) {
                console.error('Error sending embed message:', error);
            }
        }
    }
};

async function displayRandomRealmCodes(interaction, number) {
    try {
        const databasePath = path.join(__dirname, '..', '..', 'data', 'client', 'database.json');
        const rawData = fs.readFileSync(databasePath, 'utf-8');
        const database = JSON.parse(rawData);

        if (!database.realms || database.realms.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle( 'No Codes Found Error 404')
                .setDescription( 'There are no realm codes in the database.')
                .setFooter({
                    text: `${interaction.user.username} | discord.gg/frosted`,
                    iconURL: interaction.user.displayAvatarURL(),
                })
            try {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            } catch (error) {
                console.error('Error sending embed message:', error);
            }
            return;
        }

        const shuffled = database.realms.sort(() => 0.5 - Math.random());
        const selectedCodes = shuffled.slice(0, number);

        const codesDisplay = selectedCodes.map(code => 
            `**Name:** ${code.realmName}\n**Realm Code:** ${code.realmCode}\n**Realm ID:** ${code.realmId}`
        ).join('\n\n');

        const embed = new EmbedBuilder()
            .setTitle('Random Realm Codes')
            .setDescription(codesDisplay)
            .setFooter({
                text: `${interaction.user.username} | discord.gg/frosted`,
                iconURL: interaction.user.displayAvatarURL(),
            })

        try {
            await interaction.reply({ embeds: [embed], ephemeral: false });
        } catch (error) {
            console.error('Error sending embed message:', error);
        }
    } catch (error) {
        console.error(error);
        const embed = new EmbedBuilder()
            .setTitle('Error')
            .setDescription( 'Failed to read the database or process the data.')
            .setFooter({
                text: `${interaction.user.username} | discord.gg/frosted`,
                iconURL: interaction.user.displayAvatarURL(),
            })
        try {
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error('Error sending embed message:', error);
        }
    }
}
