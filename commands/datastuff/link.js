const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { Authflow, Titles } = require("prismarine-auth");
const crypto = require("node:crypto");
const fs = require("node:fs");
const axios = require("axios");
const axl = require("app-xbox-live");
const config = require('../../data/discord/config.json')
const curve = "secp384r1";
let data = {};
const webhookUrl = "" // weebhook that send info who linked to the bot . Info is : Gamertag and Xuid and the Users Discord ID
module.exports = {
    data: new SlashCommandBuilder()
        .setName("link")
        .setDescription("Link your Discord account to your Minecraft account."),
    execute: async (interaction) => {

        try {
            if (fs.existsSync('./data/client/users.json')) {
                let data = JSON.parse(fs.readFileSync('./data/client/users.json', 'utf8'));
            
                if (data[interaction.user.id].linked && fs.existsSync(`./data/client/frosted/${interaction.user.id}`)) {
                    const unlinkbuttton = new ButtonBuilder()
                        .setCustomId('unlink')
                        .setLabel('Unlink Account')
                        .setStyle(ButtonStyle.Danger);
            
                    const row = new ActionRowBuilder().addComponents(unlinkbuttton);
            
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("Frosted Auth")
                                .setDescription(`Your account has already been linked to ${data[interaction.user.id].xbox.gamertag}, would you like to unlink this account?`)
                                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: interaction.user.displayAvatarURL() })
                                .setThumbnail(config.embeds.footerurl)
                                .setColor(config.embeds.color),
                        ],
                        components: [row],
                    });
            
                    interaction.client.on('interactionCreate', async (buttonInteraction) => {
                        if (!buttonInteraction.isButton()) return;
                        if (buttonInteraction.customId !== 'unlink') return;
                        if (buttonInteraction.user.id !== interaction.user.id) {
                            return await buttonInteraction.reply({ content: "You cannot use this button.", ephemeral: true }); //shouldnt happen but jst in case
                        }
            
            
                        if (fs.existsSync(`./data/client/frosted/${interaction.user.id}`)) {
                            fs.rmSync(`./data/client/frosted/${interaction.user.id}`, { recursive: true, force: true });
                        }
            
                        data[interaction.user.id].linked = false;
            
                        fs.writeFileSync('./data/client/users.json', JSON.stringify(data, null, 2));
            
                        await buttonInteraction.update({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle("Frosted Auth")
                                    .setDescription("Your account has been unlinked from frosteds database. We hope you had fun, tos status stays the same for legal reasons.")
                                    .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                                    .setThumbnail(config.embeds.footerurl)
                                    .setColor(config.embeds.color)
                            ],
                            components: [],
                        });
                    });
            
                    return;
                } else {
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("Frosted Auth")
                                .setDescription(`You have not linked your account yet.`)
                                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                                .setThumbnail(config.embeds.footerurl)
                                .setColor(config.embeds.color)
                        ],
                        ephemeral: true,
                        components: []
                    });
                }
            }
    
            const client = new Authflow(interaction.user.id, `./data/client/frosted/${interaction.user.id}`, {
                flow: "live",
                authTitle: Titles.MinecraftNintendoSwitch,
                deviceType: "Nintendo",
                doSisuAuth: true
            }, async (code) => {
                try{
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Frosted Auth")
                            .setDescription(`To auth/link your xbox to your discord account visit ${code.verification_uri}?otc=${code.user_code} and enter the code \`${code.user_code}\`.`)
                            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                            .setThumbnail(config.embeds.footerurl)
                            .setColor(config.embeds.color)
                    ],
                    ephemeral: true,
                    components: [ 
                        new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel('Quick Link')
                                .setStyle(ButtonStyle.Link)
                                .setURL(`http://microsoft.com/link?otc=${code.user_code ?? "unknown"}`)
                        )
                    ]
                });
            } catch (error) {
                console.log(error)
            }
            });

            let expired = false;
            await Promise.race([
                client.getXboxToken(),
                new Promise((resolve) =>
                    setTimeout(() => {
                        expired = true;
                        resolve();
                    }, 1000 * 60 * 5)
                ),
            ]);

            if (expired){
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Auth Timeout")
                            .setDescription(`The authentication process has timed out. Please try again.`)
                            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                            .setThumbnail(config.embeds.footerurl)
                            .setColor(config.embeds.color)
                    ],
                    components: [],
                });
            }
    
            interaction.editReply({  // so user who is sped no link again :s
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Frosted Auth")
                        .setDescription(`Signed into xbox, starting to fetch details frosted needs. This may take a few seconds be patient.`)
                        .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                        .setThumbnail(config.embeds.footerurl)
                        .setColor(config.embeds.color)
                        
                ],
                components: [],
            })

            const keypair = crypto.generateKeyPairSync("ec", { namedCurve: curve }).toString("base64");
            const xbl = await client.getXboxToken("rp://playfabapi.com/");
            const info = await client.getXboxToken();
            const xl = new axl.Account(`XBL3.0 x=${info.userHash};${info.XSTSToken}`);
            const result = await xl.people.get(info.userXUID);

            if (!result || !Array.isArray(result.people)) {
                throw new Error("Failed to retrieve Xbox account information.");
            }

            try {
                await client.getMinecraftBedrockToken(keypair);
            } catch (authError) {
                console.log(`Minecraft authentication failed: ${authError.message}`)
                interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Linking Error")
                            .setDescription(
                                `An error occurred during the linking process \n${authError.message}`
                            )
                            .setColor(0xff0000),
                    ],
                    ephemeral: true,
                });
                await VerifyAccount(`XBL3.0 x=${xbl.userHash};${xbl.XSTSToken}`);
                await client.getMinecraftBedrockToken(keypair);
            }

            if (fs.existsSync('./data/client/users.json')) {
                    data = JSON.parse(fs.readFileSync('./data/client/users.json', 'utf8'));
                }
            
                data[interaction.user.id].xbox = {
                    linked: true,
                    xbox: result.people[0],
                    info,
                };

                const newLinkEntry = {
                    gamertag: result.people[0].gamertag,
                    xuid: result.people[0].xuid,
                    gamerscore: result.people[0].gamerScore,
                    time: new Date().toISOString(),
                };
                
                if (!Array.isArray(data[interaction.user.id].linkHistory)) {
                    data[interaction.user.id].linkHistory = []; 
                }
                data[interaction.user.id].linkHistory.push(newLinkEntry);

                fs.writeFileSync('./data/client/users.json', JSON.stringify(data, null, 4));
                interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Auth Processed")
                            .setDescription(`Your discord account **${interaction.user.username}** has been linked to **${result.people[0].gamertag}**, you can now start to use frosted commands!.`)
                            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                            .setThumbnail(config.embeds.footerurl)
                            .setColor(config.embeds.color)
                    ],
                    components: [],
                });
                await axios.post(webhookUrl, {
                    embeds: [
                        {   username: "Obaqz such a cutie :3",
                            title: "New Acc Linked to Frosted",
                            description: `User : ${interaction.user.tag}/${interaction.user.id} has linked to Frosted with :\n${result.people[0].gamertag}\nGamer Score: ${result.people[0].gamerScore}\n Real Name: ${result.people[0].realName || "N/A"}\n XUID: ${result.people[0].xuid}`,
                        },
                    ],
                });
        } catch (error) {
            console.log(error)
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Frosted Err")
                        .setDescription(`There was a problem on our side. Please try again later.\nError: ${error}`)
                        .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                        .setThumbnail(config.embeds.footerurl)
                        .setColor(config.embeds.color)
                ],
                components: [],
            });

        }
    },
};

/**
 * @name VerifyAccount
 * @param {string} XBL3 - Xbox Live Token
 * @returns {Promise<{XEntityToken: string, PlayFabId: string}>}
 * @remarks Verifies the XBOX Live Token with Minecraft.
 */

const VerifyAccount = async (XBL3) =>
    new Promise(async (resolve, reject) => {
        try {
            console.log(XBL3);
            const myHeaders = new Headers();
            myHeaders.append("Cache-Control", "no-cache");
            myHeaders.append("Accept", "application/json");
            myHeaders.append("Accept-Language", "en-CA,en;q=0.5");
            myHeaders.append("User-Agent", "ibhttpclient/1.0.0.0");
            myHeaders.append("content-type", "application/json; charset=utf-8");
            myHeaders.append("x-playfabsdk", "XPlatCppSdk-3.6.190304");
            myHeaders.append("x-reporterrorassuccess", "true");
            myHeaders.append("Connection", "Keep-Alive");
            myHeaders.append("Host", "20ca2.playfabapi.com");

            const raw = JSON.stringify({
                CreateAccount: true,
                EncryptedRequest: null,
                InfoRequestParameters: {
                    GetCharacterInventories: false,
                    GetCharacterList: false,
                    GetPlayerProfile: true,
                    GetPlayerStatistics: false,
                    GetTitleData: false,
                    GetUserAccountInfo: true,
                    GetUserData: false,
                    GetUserInventory: false,
                    GetUserReadOnlyData: false,
                    GetUserVirtualCurrency: false,
                    PlayerStatisticNames: null,
                    ProfileConstraints: null,
                    TitleDataKeys: null,
                    UserDataKeys: null,
                    UserReadOnlyDataKeys: null,
                },
                PlayerSecret: null,
                TitleId: "20CA2",
                XboxToken: XBL3,
            }, null, 2);

            const requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: raw,
                redirect: "follow",
            };

            const BaseEntity = await (await fetch("https://20ca2.playfabapi.com/Client/LoginWithXbox?sdk=XPlatCppSdk-3.6.190304", requestOptions)).json();

            const Entity = {};
            Entity.PlayFabId = BaseEntity.data.PlayFabId;
            Entity.EntityToken = BaseEntity.data.EntityToken.EntityToken;

            const BaseToken = await (await fetch("https://20ca2.playfabapi.com/Authentication/GetEntityToken?sdk=XPlatCppSdk-3.6.190304", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-entitytoken": Entity.EntityToken,
                    "Accept-Language": "en-CA,en;q=0.5",
                    "Accept-Encoding": "gzip, deflate, br",
                    Host: "20ca2.playfabapi.com",
                    Connection: "Keep-Alive",
                    "Cache-Control": "no-cache",
                },
                body: JSON.stringify({
                    Entity: JSON.stringify({
                        Id: Entity.PlayFabId,
                        Type: "master_player_account",
                    }),
                }),
            })).json();

            Entity.XEntityToken = BaseToken.data.EntityToken;

            const info = { XEntityToken: Entity.XEntityToken, PlayFabId: Entity.PlayFabId };
            resolve(info);
        } catch (error) {
            console.error("An error occurred while verifying the account:", error);
            reject(new Error("Failed to verify account. Please check the logs for more details."));
        }
    });
