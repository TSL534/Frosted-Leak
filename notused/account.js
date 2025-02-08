const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require('../../data/discord/config.json');
const fs = require('node:fs');
const colors = require('../../data/handles/colors.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName("account")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .setDescription("View your linked account"),
    async execute(interaction) {
        let linked = false
        let tos = true //how would they be heer!??!?!?!?
        interaction.client.on('error', console.error);
        if (!fs.existsSync(`./data/client/frosted/${interaction.user.id}`)) linked = true
        const data = JSON.parse(fs.readFileSync('./data/client/users.json', 'utf8'));
        if (!data[interaction.user.id].tos) {tos = false}
        await interaction.reply({ embeds: [
            new EmbedBuilder()
            .setTitle("Account")
            .setFields(
                { name: "Linked", value: `${linked ?? false}`, inline: true },
                { name: "Accepted TOS", value: `${tos ?? false}`, inline: false },
                { name: "XUID", value: `${data[interaction.user.id]?.xbox.xuid || "N/A"}`, inline: false },
                { name: "Username", value: `${data[interaction.user.id]?.xbox.displayName || "N/A"}`, inline: true },
                { name: "Gamerscore", value: `${data[interaction.user.id]?.xbox.gamerScore || "N/A"}`, inline: false },
                { name: "Reputation", value: `${data[interaction.user.id]?.xbox.xboxOneRep || "N/A"}`, inline: true },
                { name: "Frosted Money", value: `${data[interaction.user.id]?.frosted.money || "N/A"}`, inline: false },
                { name: "Frosted Cmds Used", value: `${data[interaction.user.id]?.frosted.cmds || "N/A"}`, inline: true },
                { name: "Frosted Realms Cache", value: `${data[interaction.user.id]?.frosted.realms || "N/A"}`, inline: false },

            )
            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
            .setThumbnail(config.embeds.footerurl)
            .setColor(config.embeds.color)
        ],
        ephemeral: true, //as this is true you wont need to do this again in editreply (thanks discord)
        components: []
    });
    }
};