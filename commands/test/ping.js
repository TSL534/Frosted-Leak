const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../data/discord/config.json')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .setDescription('Shows the bot ping/discord latency'),
    async execute(interaction) {
        await interaction.reply({ embeds: [
            new EmbedBuilder()
                .setTitle('Frosted Loading')
                .setDescription(`Checking data, this may take a second depending on how much is been handled.`)
                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                .setThumbnail(config.embeds.footerurl)
                .setColor(config.embeds.color)
        ] 
        })
        const embedReply = new EmbedBuilder()
            .setTitle('Pong!')
            .addFields(
                { name: 'Ping', value: `${interaction.client.ws.ping} ms`, inline: true } // yes tsl only one line!
            )
            .setTimestamp()
            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
            .setThumbnail(config.embeds.footerurl)
            .setColor(config.embeds.color)

        await interaction.editReply({ embeds: [embedReply] });
        interaction.client.on('error', console.error);
    }
};

