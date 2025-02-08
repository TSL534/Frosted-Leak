const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const { Authflow } = require('prismarine-auth');

const databasePath = path.join(__dirname, '..', '..', 'data', 'client', 'database.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('findrealm')
        .setDescription('Find a Realm by name in the database or realm list.')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name associated with the Realm Code')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('source')
                .setDescription('Choose the source to search: database, realmlist, or both.')
                .setRequired(true)
                .addChoices(
                    { name: 'Database', value: 'database' },
                    { name: 'Realm List', value: 'realmlist' },
                    { name: 'Both', value: 'both' }
                )),
    async execute(interaction) {
        const name = interaction.options.getString('name').trim().toLowerCase();
        const source = interaction.options.getString('source');
        const userId = interaction.user.id;

        await interaction.deferReply({ ephemeral: true });

        const searchResults = [];
        if (source === 'database' || source === 'both') {
            try {
                const rawData = await fs.readFile(databasePath, 'utf-8');
                const database = JSON.parse(rawData);
                const foundItems = database.realms.filter(item => item.realmName && item.realmName.toLowerCase().includes(name));
                searchResults.push(...foundItems.map(item => ({
                    Name: item.realmName,
                    'Realm Code': item.realmCode,
                    'Realm ID': item.realmId,
                    Source: 'Database'
                })));
            } catch (error) {
                console.error('Error reading the database:', error);
            }
        }

        if (source === 'realmlist' || source === 'both') {
            try {
                const authFlow = new Authflow(userId, `./data/client/frosted/${interaction.user.id}`);
                const realmsList = await listRealms(authFlow);
                const filteredRealms = realmsList.filter(realm => realm.name.toLowerCase().includes(name.toLowerCase()));
                searchResults.push(...filteredRealms.map(realm => ({
                    Name: realm.name,
                    'Realm Code': 'N/A', 
                    'Realm ID': realm.id,
                    Source: 'Realm List'
                })));
            } catch (error) {
                console.error('Error fetching the realm list:', error);
            }
        }

        if (searchResults.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle('No Results Found')
                .setDescription(`No realm codes found containing '${name}' in the ${source}`);
            return interaction.editReply({ embeds: [embed] });
        }

        const pageSize = 3;
        let currentPage = 0;
        const totalPages = Math.ceil(searchResults.length / pageSize);

        const createEmbedsForPage = (page) => {
            const start = page * pageSize;
            const end = start + pageSize;
            const pageResults = searchResults.slice(start, end);

            return [
                new EmbedBuilder()
                    .setTitle(`Realm Search Results (Page ${page + 1}/${totalPages})`)
                    .addFields(pageResults.map((item, index) => ({
                        name: `${start + index + 1}. Name: ${item.Name}`,
                        value: `**Realm Code**: ${item['Realm Code']}\n**Realm ID**: ${item['Realm ID']}\n**Source**: ${item.Source}`,
                        inline: false
                    })))
                    .setFooter({ text: `Number of search results found: ${searchResults.length}` })
            ];
        };

        const updateButtons = (locked = false) => {
            return new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('back')
                        .setLabel('Back')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(locked || currentPage === 0)
                        .setEmoji('◀️'),
                    new ButtonBuilder()
                        .setCustomId('stop')
                        .setLabel('Stop')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🛑'),
                    new ButtonBuilder()
                        .setCustomId('forward')
                        .setLabel('Forward')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(locked || currentPage === totalPages - 1)
                        .setEmoji('▶️')
                );
        };

        const embeds = createEmbedsForPage(currentPage);
        const buttons = updateButtons();

        await interaction.editReply({ embeds, components: [buttons], ephemeral: false });

        interaction.client.on('interactionCreate', async (buttonInteraction) => {
            if (!buttonInteraction.isButton()) return;
            if (buttonInteraction.user.id !== interaction.user.id) {
                return await buttonInteraction.reply({ content: 'You cannot use this button.', ephemeral: true });
            }

            if (buttonInteraction.customId === 'back') {
                if (currentPage > 0) currentPage--;
            } else if (buttonInteraction.customId === 'forward') {
                if (currentPage < totalPages - 1) currentPage++;
            } else if (buttonInteraction.customId === 'stop') {
                const finalEmbeds = createEmbedsForPage(currentPage);
                await buttonInteraction.update({ embeds: finalEmbeds, components: [] });
                return;
            }

            const newEmbeds = createEmbedsForPage(currentPage);
            const newButtons = updateButtons();
            await buttonInteraction.update({ embeds: newEmbeds, components: [newButtons] });
        });
    }
};
