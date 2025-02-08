const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const config = require('../data/discord/config.json');
const osUtils = require('os-utils');
const os = require('os');
const cooldowns = {};
const colors = require('../data/handles/colors.js');
module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {

        const now = new Date();

        const accountinfo = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/client/users.json'), 'utf8'));
        const blacklistdata = JSON.parse(fs.readFileSync('./data/discord/blacklist.json', 'utf8'));

        const user = interaction.user.id; //i could NOT be arsed to type interaction.user.id out each time (or copy and paste)

        if(!accountinfo[user]){
            accountinfo[user] = {
                linked: false,
                commands: [],
                xbox: {   // used for multi link 
                    xbox1: { 
                        linked: false, 
                    },
                    xbox2: {
                        linked: false
                    },
                    xbox3: {
                        linked: false
                    },
                },
                linkHistory:[],
                tos: false,
                frosted: {
                    money: 0,
                    realms: 0,
                    cmds: 0,
                    premium: false,
                    premiumtime: 0,
                    premiummonths: 0,
                    betatester: false,
                    staff: false,
                    realmCrashes: 0,
                    realmNukes: 0,
                    honeypotFlagges: 0,
                    streak: 0,
                }
            }
        }
        if (blacklistdata.includes(user)) {
            console.log(`${colors.blue}[${new Date().toLocaleTimeString()}] ${colors.cyan}blacklist ${colors.brightCyan}>> ${interaction.user.tag} tried to use a command ${colors.blue}(blacklist)${colors.reset}`)
            return interaction.reply({ content: `you was been a dick and got blacklisted, people laugh at you for been a dick.`, ephemeral: false });
        }


        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            if(!accountinfo[user].tos && command.data.name !== "tos"){
                return interaction.reply({
                    content: `You have not accepted the tos yet. Please use \`/tos\` first. If you have already accepted the tos please wait 30 seconds before using a command again.`,
                    ephemeral: true
                });
                //to do make it so there is a button to agree with tos here (so its on the command and users can start to uise instantly)
            }   // nuh uh to lazzy ^^

            const cooldownkey = `${user}-${interaction.commandName}`;
            const cooldowntime = 30000;
            const exemptUsers = ['959721082078760964', '1297953123268165655']; // IDs der Benutzer ohne Timeout
            
            if (!exemptUsers.includes(interaction.user.id)) {
                if (!cooldowns[cooldownkey]) {
                    cooldowns[cooldownkey] = 0;
                }
            
                const lastcmdtime = now - cooldowns[cooldownkey];
            
                if (lastcmdtime < cooldowntime) {
                    console.log(`${colors.blue}[${new Date().toLocaleTimeString()}] ${colors.cyan}cooldown ${colors.brightCyan}>> ${interaction.user.tag} tried to use a command ${colors.blue}(cooldown)${colors.reset}`);
                    const timeleft = ((cooldowntime - lastcmdtime) / 1000).toFixed(1);
                    return interaction.reply({
                        content: `You need to wait ${timeleft} more seconds before using \`${interaction.commandName}\` again.`,
                        ephemeral: true,
                    });
                }
            }
            

            if (!accountinfo[user].commands) {
                accountinfo[user].commands = []
            }
            accountinfo[user].commands.push({
                timestamp: Date.now(),
                command: interaction.commandName,
                guildid: interaction.guildId,
                channelid: interaction.channelId
            });
            accountinfo[user].frosted.cmds++;

            cooldowns[cooldownkey] = now;
            fs.writeFileSync(path.resolve(__dirname, '../data/client/users.json'), JSON.stringify(accountinfo, null, 2), 'utf8');

            try {
                await command.execute(interaction, accountinfo);
                console.log(`${colors.blue}[${new Date().toLocaleTimeString()}] ${colors.cyan}command ${colors.brightCyan}>> ${interaction.commandName} was executed by ${interaction.user.tag} ${colors.blue}(interaction)${colors.reset}`)

                const logchannel = interaction.client.channels.cache.get(config.logging.commandused);
                if (logchannel && logchannel.type === ChannelType.GuildText) {
                                
                    const cpuUsage = await new Promise((resolve) => osUtils.cpuUsage(resolve));
                    const guildName = interaction.guild ? interaction.guild.name : "DM";
                    const embed = new EmbedBuilder()
                    .setColor(0x2e3137)
                    .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
                    .setTitle("Command Used")
                    .addFields(
                        { name: "Command", value: `/${interaction.commandName} ${interaction.options._hoistedOptions.map((opt) => `**${opt.name}**: "${opt.value}"`).join(", ") || "No options"}` },
                        { name: "Guild", value: guildName || "DM", inline: true },
                        { name: "Channel", value: `<#${interaction.channelId}>`, inline: true },
                        { name: "By", value: `${interaction.user.tag} (${interaction.user.id})` },
                        { name: "RAM Usage", value: `${os.totalmem() / (1024 * 1024) - os.freemem() / (1024 * 1024).toFixed(2)}MB / ${os.totalmem() / (1024 * 1024).toFixed(2)}MB`, inline: true },
                        { name: "CPU Usage", value: `${(cpuUsage * 100).toFixed(2)}%`, inline: true }
                    )
                    .setFooter({ text: `Today at ${new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}` })
                    .setTimestamp();

                    logchannel.send({ embeds: [embed] });
                } else {
                    console.log(`${colors.blue}[${new Date().toLocaleTimeString()}] ${colors.cyan}error ${colors.brightCyan}>> logging channel not found ${colors.blue}(interaction)${colors.reset}`)
                }
                
            } catch (error) {
                console.log(`${colors.blue}[${new Date().toLocaleTimeString()}] ${colors.cyan}error ${colors.brightCyan}>> ${error} ${colors.blue}(interaction)${colors.reset}`)
            }
        }
    },
};

console.log(`${colors.blue}[${new Date().toLocaleTimeString()}] ${colors.cyan}loading ${colors.brightCyan}>> loaded interaction file ${colors.blue}(interaction)${colors.reset}`)
