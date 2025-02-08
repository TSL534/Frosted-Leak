const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getrealminfo } = require('../../men/realms');
const config  = require('../../data/discord/config.json');
const colors = require('../../data/handles/colors.js');
const fs = require('fs');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Get all realm info.')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .addStringOption(option => 
            option.setName('invite')
                .setDescription('Realm invite code')
                .setRequired(true)
                .setMinLength(11)
                .setMaxLength(15)),
    async execute(interaction) {
        interaction.client.on('error', console.error);
        const invite = interaction.options.getString('invite');

        await interaction.reply({ embeds: [
            new EmbedBuilder()
                .setTitle('Frosted Loading')
                .setDescription(`Checking data, this may take a second depending on how much is been handled.`)
                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                .setThumbnail(config.embeds.footerurl)
                .setColor(config.embeds.color)
            ] 
        })
        const whitelist = JSON.parse(fs.readFileSync('./data/client/whitelist.json', 'utf8'));
        if(whitelist.includes(invite)) {
            return interaction.editReply({ embeds: [
                new EmbedBuilder()
                    .setTitle('Frosted Error')
                    .setDescription(`The invite code is in the whitelist.`)
                    .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                    .setThumbnail(config.embeds.footerurl)
                    .setColor(config.embeds.color)
            ]})
        }
        try {
            const realmInfo = await getrealminfo(invite);

            if (!realmInfo) {
                return interaction.editReply({ embeds: [
                    new EmbedBuilder()
                        .setTitle('Frosted Error')
                        .setDescription(`The results back are empty, this may be due to the code been wrong or the account used is banned.`)
                        .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                        .setThumbnail(config.embeds.footerurl)
                        .setColor(config.embeds.color)
                    ] 
                })
            }


        await interaction.editReply({ embeds: [
            new EmbedBuilder()
                .setTitle('Frosted Info')
                .setDescription(`\`\`\`json\n${JSON.stringify(realmInfo, null, 2)}\n\`\`\``)
                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                .setThumbnail(config.embeds.footerurl)
                .setColor(config.embeds.color)
            ] 
        })

        } catch (error) {
            console.log(`${colors.blue}[${new Date().toLocaleTimeString()}] ${colors.cyan}error ${colors.brightCyan}>> error on dump command ${error.message ?? error} ${colors.blue}(dump)${colors.reset}`)
            return interaction.editReply({ embeds: [
            new EmbedBuilder()
                .setTitle('Frosted Error')
                .setDescription(`There was a error on our side. This will be fixed sortly as the error has been sent to a developer.`)
                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                .setThumbnail(config.embeds.footerurl)
                .setColor(config.embeds.color)
            ] 
        })
        }
    },
};