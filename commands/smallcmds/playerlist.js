const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getrealminfo,onlineusers } = require('../../men/realms');
const config = require('../../data/discord/config.json')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playerlist')
        .setDescription('Get not much info on a realm.')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .addStringOption(option => 
            option.setName('code')
                .setDescription('Realm Code')
                .setRequired(true)
                .setMinLength(8)
                .setMaxLength(15)),
    async execute(interaction) {
        const code = interaction.options.getString('code');
        
        try{
        const embed = new EmbedBuilder()
            .setTitle('Parsing Data')
            .setDescription(`Fetching realm data this may take a few seconds.`)
            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
            .setColor(config.embeds.color)
            
            .setTimestamp(); 
            await interaction.reply({ embeds: [embed] })
        } catch(error){
            if (error.code === 10008 || error.message.includes('Unknown Message')) {
                return; 
            } else {
                console.log(error.message);
            }
        }
        try {
            const club = await getrealminfo(code);
            const realmInfo = await onlineusers(club.clubId, interaction);

            if (!realmInfo) {
                try{

                const embed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription(`Invalid ID given. Please run /realm dump or /Club ID .`)
                .setColor(config.embeds.color)
                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                .setTimestamp();

                return  interaction.editReply({ embeds: [embed] })
            } catch(error){
                if (error.code === 10008 || error.message.includes('Unknown Message')) {
                    return; 
                } else {
                    console.log(error.message);
                }
            }
            }

            try{

            const embed = new EmbedBuilder()
                .setTitle('Realm Dump Success')
                .setDescription(`\`\`\`json\n${JSON.stringify(realmInfo, null, 2)}\n\`\`\``)
                .setColor(config.embeds.color)
                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } catch(error){
            if (error.code === 10008 || error.message.includes('Unknown Message')) {
                return; 
            } else {
                console.log(error.message);
            }
        }
        } catch (error) {
            try{

            const embed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription(`\`\`\`json\n${JSON.stringify(error.message, null, 2)}\`\`\``)

                .setColor(config.embeds.color)
                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                .setTimestamp();  
            return interaction.editReply({ embeds: [embed] })
        } catch(error){
            if (error.code === 10008 || error.message.includes('Unknown Message')) {
                return; 
            } else {
                console.log(error.message);
            }
        }
        }
    },
};