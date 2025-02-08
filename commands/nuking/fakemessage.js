const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require('../../data/discord/config.json');
const fs = require('node:fs');
const colors = require('../../data/handles/colors.js');
const path = require('path');
const { createClient } = require('bedrock-protocol');
const { dumprealm } = require('../../men/realms');
const { NIL, v3: uuidv3, v4: uuidv4 } = require('uuid');
const { Authflow, Titles } = require("prismarine-auth");
const skinData = require('../../data/client/jenny.json')
const crypto = require("node:crypto");
const curve = "secp384r1";
const keypair = crypto.generateKeyPairSync("ec", { namedCurve: curve }).toString("base64");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("fakemessage")
        .setDescription("Send's a Fake Messages of a Player with Name Spoof Support")
        .addIntegerOption(option =>
            option.setName('account')
                .setDescription('Account you wanna use')
                .setRequired(true)
                .addChoices(
                    { name: 'Account 1', value: 1 },
                    { name: 'Account 2', value: 2 },
                    { name: 'Account 3', value: 3 }))
        .addStringOption(option =>
            option.setName('invite')
                .setDescription('Realm invite code or Realm ID')
                .setRequired(true)
                .setMinLength(8)
                .setMaxLength(15))
        .addStringOption(option =>
            option.setName('messages')
                .setDescription('Messages to send, separated by ";" (e.g., "msg1;msg2").')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('count')
                .setDescription('Number of times to send the messages.')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(50000))
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name Spoof Name.')
                .setRequired(false)),

    async execute(interaction) {
        const invite = interaction.options.getString('invite');
        const name = interaction.options.getString('name') || "discord.gg/frosted";
        const account = interaction.options.getInteger('account') 
        const messageCount = interaction.options.getInteger('count');
        const messagesInput = interaction.options.getString('messages');
        let disconnected = false;

        try {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Frosted Fake Message (r)")
                        .setDescription(`Loading data, this may take a few seconds depending on the workload.`)
                        .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                        .setThumbnail(config.embeds.footerurl)
                        .setColor(config.embeds.color)
                ], ephemeral: true,
            });

            if (!fs.existsSync(`./data/client/frosted/${interaction.user.id}/profile${account}`)) {
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("X Account Not Linked X")
                            .setDescription(`It seems like you haven't linked an account yet.\nPlease link an account with \`/link\` to use this command.`)
                            .setColor(0xff0000)
                    ]
                });
                return;
            }

            const whitelist = JSON.parse(fs.readFileSync('./data/client/whitelist.json', 'utf8'));
            if (whitelist.includes(invite)) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Frosted Error')
                            .setDescription(`The invite \`${invite}\` is in the whitelist and cannot be nuked.`)
                            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                            .setThumbnail(config.embeds.footerurl)
                            .setColor(config.embeds.color)
                    ]
                });
            }

            const realm = await dumprealm(invite);
            if (!realm) {
                console.error(`[${new Date().toLocaleTimeString()}] Error: Realm not found`);
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Frosted Error')
                            .setDescription(`Invalid code: realm not found or account banned.`)
                            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                            .setThumbnail(config.embeds.footerurl)
                            .setColor(config.embeds.color)
                    ]
                });
            }

            const bot = new Authflow(
                interaction.user.id,
                path.resolve(`./data/client/frosted/${interaction.user.id}/profile${account}`),
                {
                    flow: 'live',
                    authTitle: 'MinecraftNintendoSwitch',
                    deviceType: 'Nintendo',
                    doSisuAuth: true
                }
            );

            async function refreshOrRetrieveTokens() {
                try {
                    const xboxToken = await bot.getXboxToken();
                    await bot.getMinecraftBedrockToken(keypair);
                    console.log('Susesfull Refreshed Token:', xboxToken);
                    return xboxToken;
                } catch (error) {
                    console.error('Error while Refrshing', error);
                    await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("Token Refresh Error")
                                .setDescription(`We could not refresh your Token. Try to Relink or Link a new Account`)
                                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                                .setThumbnail(config.embeds.footerurl)
                                .setColor(config.embeds.color)
                        ]
                    });
                }
            }
            
            (async () => {
                console.log('Refreshing Token...');
                
                const token = await refreshOrRetrieveTokens();
                if (token) {
                    console.log('Susessfull Refreshd Token');
                    
                } else {
                    console.log('Error Refreshing Token');
                    await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("Token Refresh Error")
                                .setDescription(`We could not refresh your Token. Try to Relink or Link a new Account`)
                                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                                .setThumbnail(config.embeds.footerurl)
                                .setColor(config.embeds.color)
                        ]
                    });
                    return;
                }
            })();

            const client = createClient({
                profilesFolder: `./data/client/frosted/${interaction.user.id}/profile${account}`,
                username: interaction.user.id,
                offline: false,
                realms: {
                    ...(invite.length === 8
                        ? { realmId: invite }
                        : { realmInvite: invite })
                },
                skinData: {
                    DeviceOS: 12,
                    DeviceId: uuidv3(uuidv4(), NIL),
                    PlatformOnlineId: genrandomstring(19, '1234567890'),
                    PrimaryUser: false,
                    SelfSignedId: uuidv4(),
                    ThirdPartyName: name,
                    ThirdPartyNameOnly: true,
                    TrustedSkin: true,
                    ...skinData 
                },
                skipPing: true
            });

            client.on('error', async (err) => {
                if (disconnected) return;
                disconnected = true;
                console.error(`[${new Date().toLocaleTimeString()}] Client error: ${err.message || err}`);
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Frosted Error')
                            .setDescription(`Error occurred: ${err.message || 'Unknown error'}`)
                            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                            .setThumbnail(config.embeds.footerurl)
                            .setColor(config.embeds.color)
                    ]
                });
                client.disconnect();
            });

            client.on('spawn', async () => {
                if (disconnected) return;
                const messages = messagesInput.split(';');

                for (let i = 0; i < messageCount; i++) {
                    for (const message of messages) {
                        client.write("text", {
                            filtered_message: "",
                            type: "chat",
                            needs_translation: false,
                            source_name: client.profile.name,
                            message: message,
                            xuid: "0",
                            platform_chat_id: "0"
                        });
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            });

            setTimeout(() => {
                if (!disconnected) {
                    client.disconnect();
                    interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Frosted Spam (r)')
                                .setDescription(`Client disconnected from ${realm.name}. Spam successful.`)
                                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                                .setThumbnail(config.embeds.footerurl)
                                .setColor(config.embeds.color)
                        ]
                    });
                    disconnected = true;
                }
            }, 200000);
        } catch (err) {
            console.error(err);
        }
    }
};

function genrandomstring(length, charSet) {
    if (!charSet) charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890_-';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += charSet.charAt(Math.floor(Math.random() * charSet.length));
    }
    return result;
}
