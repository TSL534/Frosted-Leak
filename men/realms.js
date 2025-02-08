// All functions in here are non link mostly, the ones that have a link are join realm ex

// Realm imports ig
const { Authflow: PrismarineAuth, Titles } = require('prismarine-auth');
const { RealmAPI } = require('prismarine-realms');
const { ping } = require('bedrock-protocol');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
// Xbox imports bc im lazy to send the acc request
const axl = require("app-xbox-live");

// File shit
const path = require('path')
const fs = require('fs')
const { v4: uuidv4 } = require("uuid");

// Get realm info with a return a full json
async function getrealminfo(invite) {
    const authflow = new PrismarineAuth(undefined, "./auth", { 
        flow: "live", 
        authTitle: Titles.MinecraftNintendoSwitch, 
        deviceType: "Nintendo", 
        doSisuAuth: true 
    });
    const info = await authflow.getXboxToken(); 
    const api = RealmAPI.from(authflow, 'bedrock');

    try {
        const filePath = './data/client/database.json';
        let dumpedData = [];
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            dumpedData = fileContent ? JSON.parse(fileContent) : [];
        }
        if (invite.length === 8) {
            const realminfoid = {
                id: invite,
                name: invite,
                
            };
            return realminfoid;
        }
        const realm = await api.getRealmFromInvite(invite);

        let host = null;
        let port = null;
        let server = { invalid: true };

        if(realm.state !== "CLOSED"){ 
            ({ host, port } = await realm.getAddress());
            server = await ping({ host: host, port: port });
        
        }
        const xl = new axl.Account(`XBL3.0 x=${info.userHash};${info.XSTSToken}`);
        const owner = await xl.people.get(realm.ownerUUID);
        const club = await xl.club.get(realm.clubId);
        const clubInfo = club.clubs[0];
        const ownerInfo = owner.people[0] || {};

        const ownerDetails = {
            xuid: ownerInfo.xuid || "Unknown",
            displayName: ownerInfo.displayName || "Unknown",
            gamertag: ownerInfo.gamertag || "Unknown",
            gamerScore: ownerInfo.gamerScore || "Unknown",
            presenceState: ownerInfo.presenceState || "Unknown",
            presenceText: ownerInfo.presenceText || "Unknown",
        };

        const clubdetail = {
            id: clubInfo.id,
            tags: clubInfo.tags,
            preferredColor: clubInfo.preferredColor,
            membersCount: clubInfo.membersCount,
            followersCount: clubInfo.followersCount,
            reportCount: clubInfo.reportCount,
            reportedItemsCount: clubInfo.reportedItemsCount
        };

        const realminfo = {
            id: realm.id,
            ip: host,
            port: port,
            remoteSubscriptionId: realm.remoteSubscriptionId,
            ownerUUID: realm.ownerUUID,
            name: realm.name,
            motd: realm.motd,
            defaultPermission: realm.defaultPermission,
            state: realm.state,
            daysLeft: realm.daysLeft,
            expired: realm.expired,
            expiredTrial: realm.expiredTrial,
            gracePeriod: realm.gracePeriod,
            worldType: realm.worldType,
            maxPlayers: realm.maxPlayers,
            clubId: realm.clubId,
            member: realm.member,
            invite: {
                code: invite,
                ownerxuid: realm.ownerUUID,
                codeurl: "https://realms.gg/" + invite,
            },
            server: {
                motd: server.motd,
                levelname: server.levelName,
                playersonline: server.playersOnline,
                maxplayers: server.playersMax,
                gamemode: server.gamemode ?? "unknown",
                gamemodeid: server.gamemodeId,
                version: server.version,
                protocol: server.protocol
            },
            owner: ownerDetails,
            club: clubdetail
        };

        dumpedData.push({
            realmid: realminfo.id,
            realmName: realminfo.name,
            realmCode: realminfo.invite.code,
            realmOwnerXUID: realminfo.owner.xuid,
            realmOwnerName: realminfo.owner.gamertag,
            clubID: realminfo.clubId
        });
        await fs.writeFileSync(filePath, JSON.stringify(dumpedData, null, 2));

        return realminfo;
    } catch (error) {
        console.error("Error in getrealminfo:", error);
        return { name: false, realmcode: invite, valid: false };
    }
}

// less requests
async function gethostandport(invite) {
    const authflow = await new PrismarineAuth(undefined, "./auth", { 
        flow: "live", 
        authTitle: Titles.MinecraftNintendoSwitch, 
        deviceType: "Nintendo", 
        doSisuAuth: true 
    });
    const info = await authflow.getXboxToken(); 
    const api = await RealmAPI.from(authflow, 'bedrock');

    try {
        // Get realm info ezzzz
        const realm = await api.getRealmFromInvite(invite);
        const { host, port } = await realm.getAddress();


        const hostandport = {
            name: realm.name,
            host: host,
            port: port,
        };

        return hostandport;
    } catch (error) {
        const hostandport = {
            host: null,
            port: null,
        };
        return hostandport;
    }
}


// Get realm info with a return a full json
async function dumprealm(invite) {
    const authflow = new PrismarineAuth(undefined, "./auth", { 
        flow: "live", 
        authTitle: Titles.MinecraftNintendoSwitch, 
        deviceType: "Nintendo", 
        doSisuAuth: true 
    });
    const info = await authflow.getXboxToken(); 
    const api = RealmAPI.from(authflow, 'bedrock');

    try {
        if (invite.length === 8) {
            const realminfoid = {
                id: invite,
                name: invite,
                
            };
            return realminfoid;
        }

        const realm = await api.getRealmFromInvite(invite);
        const { host, port } = await realm.getAddress();
        const server = await ping({ host: host, port: port });

        const realminfo = {
            id: realm.id,
            ip: host,
            port: port,
            remoteSubscriptionId: realm.remoteSubscriptionId,
            ownerUUID: realm.ownerUUID,
            name: realm.name,
            motd: realm.motd,
            defaultPermission: realm.defaultPermission,
            state: realm.state,
            daysLeft: realm.daysLeft,
            expired: realm.expired,
            expiredTrial: realm.expiredTrial,
            gracePeriod: realm.gracePeriod,
            worldType: realm.worldType,
            maxPlayers: realm.maxPlayers,
            clubId: realm.clubId,
            member: realm.member,
            invite: {
                code: invite,
                ownerxuid: realm.ownerUUID,
                codeurl: "https://realms.gg/" + invite,
            },
            server: {
                motd: server.motd,
                levelname: server.levelName,
                playersonline: server.playersOnline,
                maxplayers: server.playersMax,
                gamemode: server.gamemode ?? "unknown",
                gamemodeid: server.gamemodeId,
                version: server.version,
                protocol: server.protocol
            },
        };

        return realminfo;
    } catch (error) {
        return null;
    }
}






async function onlineusers(clubID, interaction) {
    const authflow = new PrismarineAuth(undefined, `./auth`, { 
        flow: "live", 
        authTitle: Titles.MinecraftNintendoSwitch, 
        deviceType: "Nintendo", 
        doSisuAuth: true 
    });

    if(clubID === "null"){
        const embed = new EmbedBuilder()
            .setColor('#7962b8')
            .setTitle('Realm Information')
            .setDescription(`Error getting realm info please use this command again in a few seconds`)
            .setTimestamp();
        return  interaction.editReply({ embeds: [embed] })
    }
    if(!clubID){
        const embed = new EmbedBuilder()
            .setColor('#7962b8')
            .setTitle('Realm Information')
            .setDescription(`Error getting realm info please use this command again in a few seconds`)
            .setTimestamp();
        return  interaction.editReply({ embeds: [embed] })
    }

    if(clubID === "null"){
        const embed = new EmbedBuilder()
            .setColor('#7962b8')
            .setTitle('Realm Information')
            .setDescription(`Error getting realm info please use this command again in a few seconds`)
            .setTimestamp();
        return  interaction.editReply({ embeds: [embed] })
    }
    try {
        const info = await authflow.getXboxToken(); 
        const xl = new axl.Account(`XBL3.0 x=${info.userHash};${info.XSTSToken}`);
        const clubData = await xl.club.get(clubID);
        
        const clubInfo = clubData.clubs[0];

        const ingameMembers = clubInfo.clubPresence
            .filter(member => member.lastSeenState === 'InGame');

        const ingameMembersInfo = await Promise.all(ingameMembers.map(async (member) => {
            const { xuid } = member;
            const personInfo = await xl.people.get(xuid);
            return {
                xuid: xuid,
                gamerTag: personInfo.people[0].gamertag,
                displayname: personInfo.people[0].displayName,
                realname: personInfo.people[0].realName,
                gamerScore: personInfo.people[0].gamerScore,
                presenceText: personInfo.people[0].presenceText,
                uniqueModernGamertag: personInfo.people[0].uniqueModernGamertag,
                xboxOneRep: personInfo.people[0].xboxOneRep,
                presenceState: personInfo.people[0].presenceState,
                lastSeenTimestamp: member.lastSeenTimestamp,
            };
        }));

        const result = {
            clubName: clubInfo.name,
            ingameMembers: ingameMembersInfo,
        };

        return result;       
    } catch (error) {
        return null;
    }
}

async function getClubData(realmCode) {
    const authflow = new PrismarineAuth(undefined, "./auth", {
        flow: "live",
        authTitle: Titles.MinecraftNintendoSwitch,
        deviceType: "Nintendo",
        doSisuAuth: true,
    });

    try {
        // Step 1: Authenticate and retrieve realm information
        const api = RealmAPI.from(authflow, 'bedrock');
        const realm = await api.getRealmFromInvite(realmCode);

        if (!realm.clubId) {
            console.error(`Realm with code ${realmCode} does not have an associated club.`);
            return null;
        }

        const clubID = realm.clubId;

        // Step 2: Use the Club ID to fetch detailed club data
        const info = await authflow.getXboxToken();
        const xl = new axl.Account(`XBL3.0 x=${info.userHash};${info.XSTSToken}`);
        const clubData = await xl.club.get(clubID);

        const clubInfo = clubData.clubs[0];

        return {
            clubId: clubInfo.id,
            name: clubInfo.name,
            tags: clubInfo.tags,
            preferredColor: clubInfo.preferredColor,
            membersCount: clubInfo.membersCount,
            followersCount: clubInfo.followersCount,
            reportCount: clubInfo.reportCount,
            reportedItemsCount: clubInfo.reportedItemsCount,
        };
    } catch (error) {
        console.error("Error in getClubDataFromRealmCode:", error);
        return null;
    }
}


async function checkaccount(userid, interaction) {
    const profilesFolder = `../data/client/frosted/${interaction.user.id}`;
    const accountsPath = path.join('../data/client/users.json');
    let accountsData;
    let linked = false;

    try {
        accountsData = JSON.parse(fs.readFileSync(accountsPath));
    } catch (error) {
        const errorEmbed = new EmbedBuilder()
            .setTitle("Drex Err")
            .setDescription(`\`\`\`json\n${JSON.stringify(error.message, null, 2)}\`\`\``)
            .setColor('#7962b8');
        await interaction.editReply({ embeds: [errorEmbed] });
        return;
    }

    const accountInfo = accountsData[userid];

    if (!accountInfo) {
        const unlinkedEmbed = new EmbedBuilder()
            .setTitle("Frosted Err")
            .setDescription("You have never used a drex command. To get started using main realm commands, please do **/link**.")
            .setColor('#7962b8');
        await interaction.editReply({ embeds: [unlinkedEmbed] });
        return;
    }

    if (accountInfo.removed === true) {
        const removedEmbed = new EmbedBuilder()
            .setTitle("Frosted Err")
            .setDescription("You have to link your account to use this command. Please link to use this command.")
            .setColor('#7962b8');
        await interaction.editReply({ embeds: [removedEmbed] });
        return;
    }

    linked = true;
    return linked;
}

module.exports = { 
    getrealminfo,
    gethostandport,
    onlineusers,
    dumprealm,
    checkaccount,
    getClubData,
    
};