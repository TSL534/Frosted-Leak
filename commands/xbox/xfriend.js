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
        .setName("xfriend")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .setDescription("Add or remove an Xbox friend based on gamertag.")
        .addIntegerOption(option =>
            option.setName('account')
                .setDescription('Account you wanna use')
                .setRequired(true)
                .addChoices(
                    { name: 'Account 1', value: 1 },
                    { name: 'Account 2', value: 2 },
                    { name: 'Account 3', value: 3 }))
        .addStringOption(option => 
            option.setName("action")
                .setDescription("Choose to add or remove a friend")
                .setRequired(true)
                .addChoices(
                    { name: 'Add', value: 'add' },
                    { name: 'Remove', value: 'remove' }
                )
        )
        .addStringOption(option =>
            option.setName("gamertag")
                .setDescription("Enter the gamertag of the user")
                .setRequired(true)
        ),

    async execute(interaction) {
        const account = interaction.options.getInteger('account') 
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
            

            if (!fs.existsSync(`./data/client/frosted/${interaction.user.id}/profile${account}`)) {
                await interaction.editReply({
                    embeds: [
                        {
                            title: `X Account Not Linked X`,
                            description: `It seems like you haven't linked an account yet.\nPlease link an account whit `+'`/link `' + `to use this command.`,
                            color: 0xff0000,
                            footer: { text: "e" },
                        },
                    ],
                });
                return;
            }

            
            const authflow = new PrismarineAuth(interaction.user.id, `./data/client/frosted/${interaction.user.id}/profile${account}`, { 
                flow: "live", 
                authTitle: Titles.MinecraftNintendoSwitch, 
                deviceType: "Nintendo", 
                doSisuAuth: true 
            });
        

            const info = await authflow.getXboxToken(); 
            const xl = new axl.Account(`XBL3.0 x=${info.userHash};${info.XSTSToken}`);
            const gamertag = interaction.options.getString("gamertag");
            const action = interaction.options.getString("action");

            const searchResults = await xl.people.find(gamertag, 1);

            if (!searchResults || !searchResults.people || searchResults.people.length === 0) {
                await interaction.reply({ content: `No users found matching the gamertag "${gamertag}".`, ephemeral: true });
                return;
            }

            const selectedUser = searchResults.people[0];
            const xuid = selectedUser.xuid;

            if (action === "add") {
                await xl.people.add(xuid);
                const successEmbed = new EmbedBuilder()
                    .setColor('#70629E')
                    .setTitle("Friend Added")
                    .setDescription(`Successfully added **${selectedUser.gamertag}** as a friend.`)
                    .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })

                await interaction.editReply({ embeds: [successEmbed], ephemeral: false });
            } else if (action === "remove") {
                await xl.people.remove(xuid);
                const successEmbed = new EmbedBuilder()
                     .setColor('#70629E')
                    .setTitle("Friend Removed")
                    .setDescription(`Successfully removed **${selectedUser.gamertag}** from your friends.`)
                    .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                await interaction.editReply({ embeds: [successEmbed], ephemeral: false });
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: "There was an error while executing this command!", ephemeral: true });
        }
    }
};
