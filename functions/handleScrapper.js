// this is to not be touched this took obaqz / 0devs way to long
// this by time will have LFG (visions but updated max), and other websites.
// this is a work in progress
// 2/5





const { REST, SlashCommandBuilder, WebhookClient, EmbedBuilder  } = require("discord.js");
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const config = require('../data/discord/config.json');
const colors = require('../data/handles/colors.js');
const {Authflow, Titles, RelyingParty} = require("prismarine-auth");
const { RealmAPI } = require('prismarine-realms')

const { json } = require("stream/consumers");
module.exports = (client) => {
    client.on('ready', async () => {})//will i need no
    client.on('error', async () => {})//will i need no
    client.on('messageCreate', async () => {})//will i need no
    client.on('messageDelete', async () => {})//will i need no
    client.on('messageUpdate', async () => {})//will i need no
    client.on('messageReactionAdd', async () => {})//will i need no
    client.on('messageReactionRemove', async () => {})//will i need no
    client.on('messageReactionRemoveAll', async () => {})//will i need no
    client.on('messageReactionRemoveEmoji', async () => {})//will i need no
    client.on('presenceUpdate', async () => {})//will i need no
    client.on('typingStart', async () => {})//will i need no
    client.on('typingStop', async () => {})//will i need no
    client.on('voiceStateUpdate', async () => {})//will i need no   
    try {
        lfgscrapper()
    } catch (error) {
        console.log(`${colors.blue}[${new Date().toLocaleTimeString()}] ${colors.cyan}error ${colors.brightCyan}>> error in realm scrapper ${error.message ?? error} ${colors.blue}(scrapper)${colors.reset}`)
    }
};



async function lfgscrapper() {
    const webhook = new WebhookClient({ url: 'https://discord.com/api/webhooks/1318686969861116008/O9NR4Ar9qDXfGOTd0Sqtn9pwaMUei70N83BiqXAMQw-zyYYqcHKKl7O6TQDpS0rB3imp' });
    console.log(`${colors.blue}[${new Date().toLocaleTimeString()}] ${colors.cyan}starting ${colors.brightCyan}>> started to find realm codes ${colors.blue}(lfg)${colors.reset}`);

    const client = await new Authflow('frostedlfg', './data/client/cmdaccounts/frostedlfg', {
        flow: 'sisu',
        authTitle: '000000004424DA1F',
        deviceType: 'Win32'
    });

    const api = RealmAPI.from(client, 'bedrock');

    const xToken = await client.getXboxToken().catch((err) => {
        console.log(err);
        process.exit(1);
    });
    const rToken = await client.getXboxToken('https://pocket.realms.minecraft.net/').catch((err) => {
        console.log(err);
        process.exit(1);
    });

    const realmArray = require('../data/client/scrapped.json');
    const fridge = require('../data/client/dbsearch.json');
    const invalidRealmArray = require('../data/client/iscrapped.json');

    const regex = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d_-]{11,15}/gm;

    const sendtodiscord = async (realmCode, realmData, host, port) => {
        try {
            await webhook.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Frosted Devs 🙀')
                        .setDescription(`\`${realmData.name}\` - \`${realmCode}\` >> \`${host}:${port}\` was found lacking, running down the opps slowly lil nga.`)
                        .setColor(config.embeds.color)
                ],
                username: 'Frosted Develops'
            });
        } catch (err) {
            console.error('Error sending to Discord webhook:', err.message);
        }
    };

    const fetchCodes = async () => {
        try {
            const posts = await fetch('https://sessiondirectory.xboxlive.com/handles/query?include=relatedInfo,roleInfo,activityInfo', {
                method: 'POST',
                headers: {
                    'x-xbl-contract-version': 107,
                    'Accept': 'application/json',
                    'Accept-Language': 'en-US',
                    'Authorization': `XBL3.0 x=${xToken.userHash};${xToken.XSTSToken}`
                },
                body: JSON.stringify({
                    type: 'search',
                    templateName: 'global(lfg)',
                    orderBy: 'suggestedLfg desc',
                    communicatePermissionRequired: true,
                    includeScheduled: true,
                    filter: 'session/titleId eq 1828326430 and session/roles/lfg/confirmed/needs ge 1'
                })
            }).catch(() => {});

            if (!posts) return
            const data = await posts.json();
            if(!data) return // wont need but im adding it for safty (there was an error in testing)

            for (const result of data.results) {
                if (!result.relatedInfo?.description) continue;

                const realmCodes = result.relatedInfo.description.text.match(regex);
                if (!realmCodes) continue;

                for (const code of realmCodes) {
                    if (realmArray.includes(code) || invalidRealmArray.includes(code)) continue;

                    try {
                        const realm = await api.getRealmFromInvite(code);
                        if(realm){
                            const { host, port } = await realm.getAddress();
                            console.log(`${colors.blue}[${new Date().toLocaleTimeString()}] ${colors.cyan}fetched ${colors.brightCyan}>> ${code} - ${host}:${port} ${colors.blue}(lfg)${colors.reset}`);
                            realmArray.push(code);
                            fridge.push({ [code]: [realm] });
                            await sendtodiscord(code, realm, host, port);
                        } else {
                            console.log(`${colors.blue}[${new Date().toLocaleTimeString()}] ${colors.cyan}error ${colors.brightCyan}>> failed to fetch (realm not found) ${colors.blue}(lfg)${colors.reset}`);
                            invalidRealmArray.push(code);
                            continue
                        }
                    } catch (error) {
                        if (error.message.includes('Invite Link not found')) {
                            invalidRealmArray.push(code);
                            console.log(`${colors.blue}[${new Date().toLocaleTimeString()}] ${colors.cyan}error ${colors.brightCyan}>> Invite link not found ${code} ${colors.blue}(lfg)${colors.reset}`);
                            continue
                        } else {
                            console.log(`${colors.blue}[${new Date().toLocaleTimeString()}] ${colors.cyan}error ${colors.brightCyan}>> ${error.message ?? error} ${colors.blue}(lfg)${colors.reset}`);
                            continue
                        }
                    }
                    
                }
            }
        } catch (error) {
            console.log(error);
        }

        fs.writeFileSync('./data/client/scrapped.json', JSON.stringify(realmArray, null, 2));
        fs.writeFileSync('./data/client/dbsearch.json', JSON.stringify(fridge, null, 2));
        fs.writeFileSync('./data/client/iscrapped.json', JSON.stringify(invalidRealmArray, null, 2));
    };

    fetchCodes();
    setInterval(fetchCodes, 120000);
}
