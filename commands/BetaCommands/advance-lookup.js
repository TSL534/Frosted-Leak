const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require('../../data/discord/config.json');
const fs = require('node:fs');
const colors = require('../../data/handles/colors.js');
const path = require('path');
const { createClient } = require('bedrock-protocol');
const { NIL, v3: uuidv3, v4: uuidv4 } = require('uuid');
const { Authflow, Titles } = require("prismarine-auth");
const skinData = require('../../data/client/jenny.json')
const { getrealminfo,onlineusers } = require('../../men/realms');
// this command is not fully done and pluh
module.exports = {
    data: new SlashCommandBuilder()
        .setName("lookupv2")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .setDescription("Get the World Data of the Realm")
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
        .addStringOption(option =>
            option.setName('namespoof_name')
                .setDescription('Realm invite code')
                .setRequired(false)
                .setMinLength(1)
                .setMaxLength(40)),
    async execute(interaction) {
        const invite = interaction.options.getString('invite');
        const namespoof = interaction.options.getString('namespoof_name') | "discord.gg/frosted"
        const account = interaction.options.getInteger('account')
        let disconnected = false;

        try {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Frosted Lookup (r)")
                        .setDescription(`Loading data, this may take a few seconds depending on the workload.`)
                        .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                        .setThumbnail(config.embeds.footerurl)
                        .setColor(config.embeds.color)
                ],ephemeral: false,
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

            client.on('start_game', async (packet) => {
                console.log(`${colors.green}[Realm Watcher]${colors.cyan}>> User ${interaction.user.username}/${interaction.user.id} join Realm ${realm.name}/${invite}  `)
                const seed = packet.seed;
                const runtimeEntityId = packet.runtime_entity_id
                const biome = packet.biome_name
                const achievements = packet.achievements_disabled
                const difficulty = packet.difficulty
                const dimension = packet.dimension
                const emote_chat_muted = packet.emote_chat_muted
                const engine = packet.engine
                const entity_id = packet.entity_id
                const multiplayer_correlation_id = packet.multiplayer_correlation_id
                const only_spawn_v1_villagers = packet.only_spawn_v1_villagers
                const premium_world_template_id = packet.premium_world_template_id
                const server_identifier = packet.server_identifier
                const world_gamemode = packet.world_gamemode
                const world_template_id = packet.world_template_id
                const permission_level = packet.permission_level
                const club = await getrealminfo(invite);
                const realmInfo = await onlineusers(club.clubId, interaction);
                try {
                    await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('World Info')
                                .setDescription(`Seed: ${seed}\nRuntime: ${runtimeEntityId}\nEntity ID: ${entity_id}\nPermission: ${permission_level}\nEngine: ${engine}\nAchievments: ${achievements}\nDifficulty: ${difficulty}\nDimension: ${dimension}\nBiom: ${biome}\nEmote Chat Muted: ${emote_chat_muted}\nMultiplayer Correlation ID: ${multiplayer_correlation_id}\nPremium World Template ID: ${premium_world_template_id}\nWorld Template ID: ${world_template_id}  `)
                                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                                .setThumbnail(config.embeds.footerurl)
                                .setColor(config.embeds.color)
                        ]
                    });

                    await interaction.followUp({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Players')
                                .setDescription(`\`\`\`json\n${JSON.stringify(realmInfo, null, 2)}\n\`\`\``)
                                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                                .setThumbnail(config.embeds.footerurl)
                                .setColor(config.embeds.color)
                        ]
                    });

                    await interaction.followUp({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Realm Info')
                                .setDescription(`\`\`\`json\n${JSON.stringify(club, null, 2)}\n\`\`\``)
                                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                                .setThumbnail(config.embeds.footerurl)
                                .setColor(config.embeds.color)
                        ]
                    });

                    setTimeout(() => {
                        if (!disconnected) {
                            client.disconnect();
                            disconnected = true;
                        }
                    }, 2 * 1000);
                } catch (error) {
                    console.error(error);
                    throw error;
                }
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
