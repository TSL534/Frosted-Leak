const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axl = require("app-xbox-live");
const { Authflow: PrismarineAuth, Titles } = require('prismarine-auth');
const algorithm = 'aes-256-cbc';
const secretKey = 'YYujWJY7xXXHpOqJut2m5CPyeBTdkYSp';
const config = require('../../data/discord/config.json');

function decrypt(text) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("xlookup")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .setDescription("Display detailed Xbox user information based on gamertag.")
        .addStringOption(option =>
            option.setName("gamertag")
                .setDescription("Enter the gamertag to search for")
                .setRequired(true)
        ),

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
        try {
            const user = interaction.user.id;
            const authflow = new PrismarineAuth(undefined, `./auth`, { 
                flow: "live", 
                authTitle: Titles.MinecraftNintendoSwitch, 
                deviceType: "Nintendo", 
                doSisuAuth: true 
            });
            const info = await authflow.getXboxToken(); 
            const xl = new axl.Account(`XBL3.0 x=${info.userHash};${info.XSTSToken}`);
            const gamertag = interaction.options.getString("gamertag");

            const searchResults = await xl.people.find(gamertag, 1);

            if (!searchResults || !searchResults.people || searchResults.people.length === 0) {
                await interaction.editReply({ content: `No users found matching the gamertag "${gamertag}".`, ephemeral: true });
                return;
            }

            const selectedUser = searchResults.people[0];
            const detail = selectedUser.detail;

            let description = `**Gamertag**: ${selectedUser.gamertag}\n`;
            if (selectedUser.xuid) description += `**Xuid**: ${selectedUser.xuid}\n`;
            if (detail.isVerified == true ?? false) description += `**Verifyied**: ${detail.isVerified}\n`;
            if (selectedUser.gamerScore) description += `**Gamerscore**: ${selectedUser.gamerScore}\n`;
            if (selectedUser.uniqueModernGamertag) description += `**Unique Gamertag**: ${selectedUser.uniqueModernGamertag}\n`;
            if (selectedUser.xboxOneRep) description += `**Reputation**: ${selectedUser.xboxOneRep}\n`;
            if (detail.accountTier) description += `**Account Tier**: ${detail.accountTier}\n`;
            if (detail.bio) description += `**Bio**: ${detail.bio}\n`;
            if (detail.location) description += `**Location**: ${detail.location}\n`;
            if (detail.tenure) description += `**Tenure**: ${detail.tenure}\n`;
            if (detail.followerCount) description += `**Followers**: ${detail.followerCount}\n`;
            if (detail.followingCount) description += `**Following**: ${detail.followingCount}\n`;
            description += `**Has Game Pass**: ${detail.hasGamePass ? 'Yes' : 'No'}\n`;
            description += `**Primary Color**: #${selectedUser.preferredColor.primaryColor}\n`;
            description += `**Secondary Color**: #${selectedUser.preferredColor.secondaryColor}\n`;

            const detailedEmbed = new EmbedBuilder()
                .setColor('#70629E')
                .setTitle(`${selectedUser.gamertag}'s Profile`)
                .setDescription(description)
                .setThumbnail(selectedUser.displayPicRaw)
                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })


            await interaction.editReply({ embeds: [detailedEmbed], ephemeral: false });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: "There was an error while executing this command!", ephemeral: true });
        }
    }
};
