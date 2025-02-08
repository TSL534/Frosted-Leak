const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("node:fs");
const config = require('../../data/discord/config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("tos")
        .setDescription("Agree to the TOS and start using commands."),
    execute: async (interaction) => {
        interaction.client.on('error', console.error);

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("Frosted TOS")
                    .setDescription("Checking if you have already accepted the TOS...")
                    .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                    .setThumbnail(config.embeds.footerurl)
                    .setColor(config.embeds.color),
            ],
            ephemeral: true,
        });

        let data = {};
        if (fs.existsSync('./data/client/users.json')) {
            data = JSON.parse(fs.readFileSync('./data/client/users.json', 'utf8'));
        }

        if (data[interaction.user.id]?.tos) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Frosted TOS")
                        .setDescription("You have already accepted the TOS. Use `/link` to get started!")
                        .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: interaction.user.displayAvatarURL() })
                        .setThumbnail(config.embeds.footerurl)
                        .setColor(config.embeds.color),
                ],
                ephemeral: true,
            });
            return;
        }

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("Frosted TOS")
                    .setDescription(
                        "By agreeing, you accept all responsibility for using Frosted, including spam or other actions. Frosted and its developers are not liable for your actions."
                    )
                    .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                    .setThumbnail(config.embeds.footerurl)
                    .setColor(config.embeds.color),
            ],
            components: [],
            ephemeral: true,
        });

        interaction.client.on('interactionCreate', async (btnInteraction) => {
            if (
                btnInteraction.isButton() &&
                btnInteraction.customId === 'agree_tos' &&
                btnInteraction.user.id === interaction.user.id
            ) {
                data[interaction.user.id] = { ...data[interaction.user.id], tos: true };

                fs.writeFileSync('./data/client/users.json', JSON.stringify(data, null, 2));

                await btnInteraction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Frosted TOS")
                            .setDescription("You have agreed to the TOS and can now start using Frosted.")
                            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                            .setThumbnail(config.embeds.footerurl)
                            .setColor(config.embeds.color),
                    ],
                    components: [],
                });
            }
        });

        const tosButton = new ButtonBuilder()
            .setCustomId('agree_tos')
            .setLabel('Agree to TOS')
            .setStyle(ButtonStyle.Success);

        const buttonRow = new ActionRowBuilder().addComponents(tosButton);

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("Frosted TOS")
                    .setDescription(
                        "Please click the button below to agree to the TOS."
                    )
                    .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                    .setThumbnail(config.embeds.footerurl)
                    .setColor(config.embeds.color),
            ],
            components: [buttonRow],
            ephemeral: true,
        });
    },
};
