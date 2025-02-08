const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require('../../data/discord/config.json');
const fs = require('node:fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("account")
        .setDescription("View your linked accounts"),
    async execute(interaction) {
        const userId = interaction.user.id;

        const data = JSON.parse(fs.readFileSync('./data/client/users.json', 'utf8'));

        if (!data[userId]) {
            return interaction.reply({ content: "No data found for your account.", ephemeral: true });
        }

        const frostedData = data[userId] || {};
        const jsonRepresentation = `{\n
"Frosted Money": "${frostedData.frosted?.money ?? "0"}",
"Commands Used": "${frostedData.frosted?.cmds ?? "N/A"}"
"Beta Tester": "${frostedData.frosted?.betatester ?? "N/A"}"
"Staff": "${frostedData.frosted?.staff ?? "N/A"}"
"Premium": "${frostedData.frosted?.premium ?? "N/A"}"
"Premiumtime": "${frostedData.frosted?.premiumtime ?? "0"}"\n
"Nuke Stats:"${"----------"}
"Realm Crashes": "${frostedData.frosted?.realmCrashes ?? "0"}"
"Realm Nukes": "${frostedData.frosted?.realmNukes ?? "0"}"
"Honeypot Flagges": "${frostedData.frosted?.honeypotFlagges ?? "N/A"}"

          \n}`;
        const globalEmbed = new  EmbedBuilder()
            .setTitle("Your Frosted Account Overview")
            .setDescription(`\`\`\`json\n${jsonRepresentation}\n\`\`\``)
            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
            .setThumbnail(config.embeds.footerurl)
            .setColor(config.embeds.color);

        await interaction.reply({ embeds: [globalEmbed], ephemeral: true });

        const xboxAccounts = ['xbox'];

        for (const account of xboxAccounts) {
            const accountData = data[userId] || { linked: false };
            const accountData2 = data[userId] || { linked: false };
            const jsonRepresentation2 = [`{\n
"Linked": "${accountData2.linked ? "True" : "False"}"
"XUID": "${accountData2.linked ? accountData.xbox.xuid || accountData.xuid : "N/A"}"
"GamerTag": "${accountData2.linked ? accountData.xbox.gamertag || accountData.xbox.gamertag : "N/A"}"
"Gamer Score": "${accountData2.linked ? accountData.xbox.gamerScore || accountData.xbox.gamerScore : "N/A"}"
"Reputation": "${accountData2.linked ? accountData.xbox.xboxOneRep || accountData.xbox.xboxOneRep : "N/A"}"
"Account Tier": "${accountData2.linked ? accountData.xbox.detail.accountTier || accountData.xbox.detail.accountTier : "N/A"}"

\n}`]
            const accountEmbed = new EmbedBuilder()
                .setTitle(`Account: ${account.charAt(0).toUpperCase() + account.slice(1)}`)
                .setDescription(`\`\`\`json\n${jsonRepresentation2}\n\`\`\``)
                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                .setThumbnail(`${accountData.linked ? accountData.xbox.displayPicRaw|| accountData.xbox.displayPicRaw: config.embeds.footerurl}`)
                .setColor(config.embeds.color);

            await interaction.followUp({ embeds: [accountEmbed], ephemeral: true });
        }
    }
};
