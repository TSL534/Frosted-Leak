const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, SelectMenuBuilder, ButtonBuilder, ButtonStyle,StringSelectMenuBuilder } = require("discord.js");
const { Authflow, Titles } = require("prismarine-auth");
const fs = require("fs");
const crypto = require("crypto");
const axios = require("axios");
const axl = require("app-xbox-live");
const config = require('../../data/discord/config.json');
const webhookUrl = "";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("link")
        .setDescription("Link your Discord account to your Minecraft account.")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        ,
    execute: async (interaction) => {
        try {

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select-account')
                .setPlaceholder('Choose an account to link')
                .addOptions([
                    { label: 'Account 1', value: '1' },
                    { label: 'Account 2', value: '2' },
                    { label: 'Account 3', value: '3' },
                ]);

            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Frosted Auth")
                        .setDescription("Please select an account to link.")
                        .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                        .setThumbnail(config.embeds.footerurl)
                        .setColor(config.embeds.color)
                ],
                components: [new ActionRowBuilder().addComponents(selectMenu)],
                ephemeral: true
            });

            interaction.client.on('interactionCreate', async (menuInteraction) => {
                if (!menuInteraction.isStringSelectMenu() || menuInteraction.customId !== 'select-account' || menuInteraction.user.id !== interaction.user.id) return;

                const selectedAccount = menuInteraction.values[0];
                const profilePath = `./data/client/frosted/${interaction.user.id}/profile${selectedAccount}`;
                await menuInteraction.deferReply({ ephemeral: true });
                if (fs.existsSync(profilePath)) {
                    return await menuInteraction.followUp({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("Frosted Auth")
                                .setDescription(`Account ${selectedAccount} is already linked.`)
                                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                                .setThumbnail(config.embeds.footerurl)
                                .setColor(config.embeds.color)
                        ],
                        ephemeral: true
                    });
                }

                const client = new Authflow(interaction.user.id, profilePath, {
                    flow: "live",
                    authTitle: Titles.MinecraftNintendoSwitch,
                    deviceType: "Nintendo",
                    doSisuAuth: true
                }, async (code) => {
                    await menuInteraction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("Frosted Auth")
                                .setDescription(`To link your Xbox to your Discord account, visit ${code.verification_uri}?otc=${code.user_code} and enter the code \`${code.user_code}\`.`)
                                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                                .setThumbnail(config.embeds.footerurl)
                                .setColor(config.embeds.color)
                        ],
                        components: [],
                        ephemeral: true
                    });
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

                if (expired) {
                    return menuInteraction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("Auth Timeout")
                                .setDescription("The authentication process has timed out. Please try again.")
                                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                                .setThumbnail(config.embeds.footerurl)
                                .setColor(config.embeds.color)
                        ],
                        components: [],
                    });
                }

                const keypair = crypto.generateKeyPairSync("ec", { namedCurve: "secp384r1" }).toString("base64");
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
                    menuInteraction.editReply({
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

                let data = {};
                if (fs.existsSync('./data/client/users.json')) {
                    data = JSON.parse(fs.readFileSync('./data/client/users.json', 'utf8'));
                }

                if (!data[interaction.user.id]) {
                    data[interaction.user.id] = { xbox: {} };
                }

                data[interaction.user.id].xbox[`xbox${selectedAccount}`] = {
                    linked: true,
                    xbox: result.people[0],
                    info,
                    frosted: {
                        money: 0,
                        commands: 0,
                        realms: 0
                    }
                };

                fs.writeFileSync('./data/client/users.json', JSON.stringify(data, null, 4));

                await menuInteraction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Auth Processed")
                            .setDescription(`Your Discord account **${interaction.user.username}** has been linked to **${result.people[0].gamertag}**.`)
                            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                            .setThumbnail(config.embeds.footerurl)
                            .setColor(config.embeds.color)
                    ],
                    components: [],
                    ephemeral: true
                });

                await axios.post(webhookUrl, {
                    embeds: [
                        {
                            username: "Obaqz such a cutie :3",
                            title: "New Acc Linked to Frosted",
                            description: `User : ${interaction.user.tag}/${interaction.user.id} has linked to Frosted with :\n${result.people[0].gamertag}\nGamer Score: ${result.people[0].gamerScore}\n Real Name: ${result.people[0].realName || "N/A"}\n XUID: ${result.people[0].xuid}`,
                        },
                    ],
                });
            });

        } catch (error) {
            console.error(error);
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Error")
                        .setDescription("An unexpected error occurred while processing your request.")
                        .setColor(0xff0000)
                ],
                ephemeral: true
            });
        }
    }
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
            reject(new Error("This is a silly XBOX Api Error, Rerun the Command."));
            await menuInteraction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Error")
                        .setDescription(`Pls rerun the Command , this is a silly xbox API error.`)
                        .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                        .setThumbnail(config.embeds.footerurl)
                        .setColor(config.embeds.color)
                ],
                components: [],
                ephemeral: true
            });
        }
    });
