const fs = require('fs');
const { RealmAPI } = require('prismarine-realms');
const { Authflow } = require('prismarine-auth');
const databasePath = './database.json';

function loadDatabase() {
    if (!fs.existsSync(databasePath)) {
        fs.writeFileSync(databasePath, JSON.stringify({ realms: [] }, null, 2));
    }
    return JSON.parse(fs.readFileSync(databasePath, 'utf8'));
}

function saveDatabase(data) {
    fs.writeFileSync(databasePath, JSON.stringify(data, null, 2));
}

async function checkAndSaveRealm(realmCode, userId) {
    const profilesFolder = `./authCache/${userId}`;
    const userIdentifier = undefined; 
    const options = { authTitle: '00000000441cc96b', flow: 'live' };

    if (!fs.existsSync(profilesFolder)) {
        throw new Error(`Account not linked for user ID: ${userId}`);
    }

    const authFlow = new Authflow(userIdentifier, profilesFolder, options);
    const realms = RealmAPI.from(authFlow, 'bedrock');

    try {
        const realm = await realms.getRealmFromInvite(realmCode);

        if (!realm) {
            throw new Error('[Auto DB]Invalid or non-existent realm code.');
        }

        const realmName = realm.name;
        const realmId = realm.id;

        const database = loadDatabase();
        if (database.realms.some(r => r.realmCode === realmCode)) {
            throw new Error('[Auto DB]Realm code already exists in the database.');
        }

        database.realms.push({ realmName, realmCode, realmId });
        saveDatabase(database);

        console.log(`[Auto DB]Successfully added realm: ${realmName} (${realmCode})`);
    } catch (error) {
        console.error(`[Auto DB]Error checking or saving realm: ${error.message}`);
        throw error;
    }
}

function saveCoins(userId, coins) {
    const filePath = './data/users.json';
    let users = [];

    if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        users = JSON.parse(fileContent);
    }

    const userIndex = users.findIndex(user => user.userid === userId);

    if (userIndex === -1) {
        console.error(`User ${userId} not founded.`);
        return;
    }

    users[userIndex].coins = (users[userIndex].coins || 0) + coins;

    fs.writeFileSync(filePath, JSON.stringify(users, null, 4), 'utf8');
    console.log(`User ${userId} now has ${users[userIndex].coins} Coins.`);
}


module.exports = { 
    checkAndSaveRealm,
    saveCoins
    
};