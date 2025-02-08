const { RealmAPI } = require('prismarine-realms');
const { Authflow } = require('prismarine-auth');
const path = require('path');
const fsPromises = require('fs/promises');

const databasePath = path.join(__dirname, "..", "data", "client", "database.json");

exports.run = async (message, args) => {
    if (!args[0]) {
        return message.reply('`!check` is a command to verify the validity of a Realm code.\n\nSyntax: !checkrealm <realm-code>');
    }

    const realmCodes = Array.isArray(args) ? args : [args[0]];

    const checkCodes = async (codes) => {
        const profilesFolder = './auth';
        const options = {
            authTitle: '00000000441cc96b',
            flow: 'live',
        };

        const userIdentifier = undefined;
        const authFlow = new Authflow(userIdentifier, profilesFolder, options);
        const api = RealmAPI.from(authFlow, 'bedrock');
        const database = await readDatabase();

        const checkPromises = codes.map(async (code) => {
            try {
                const realm = await api.getRealmFromInvite(code);
                if (!realm) {
                    return { realmCode: code, status: 'invalid' };
                }

                const address = await realm.getAddress();
                return {
                    realmCode: code,
                    status: 'valid',
                    realmName: realm.name,
                    realmId: realm.id,
                };
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    return { realmCode: code, status: 'invalid', error: 'Realm not found' };
                }
                console.error(`[ERROR] Error fetching realm data for code "${code}":`, error);
                return { realmCode: code, status: 'error', error: error.message };
            }
        });

        try {
            return await Promise.all(checkPromises);
        } catch (error) {
            console.error('Error processing realm codes:', error);
            return [{ code: 'unknown', status: 'error', error: error.message }];
        }
    };

    try {
        const results = await checkCodes(realmCodes);
        const database = await readDatabase();

        results.forEach((result) => {
            if (result.status === 'valid') {
                message.reply(`Valid Realm found! Name: **${result.realmName}**, ID: **${result.realmId}**`);
                const realmExists = database.realms.some((realm) => realm.realmCode === result.realmCode);

                if (!realmExists) {
                    database.realms.push({
                        realmName: result.realmName,
                        realmCode: result.realmCode,
                        realmId: result.realmId,
                    });
                    console.log(`[DB] Added realm code "${result.realmCode}" to the database.`);
                } else {
                    console.log(`[DB] Realm code "${result.realmCode}" already exists in the database.`);
                }
            } else if (result.status === 'invalid') {
                message.reply(`Realm code "${result.realmCode}" is invalid.`);
                console.log(`[WARN] Invalid realm code: ${result.realmCode}`);
            } else {
                message.reply(`An error occurred for realm code "${result.realmCode}": ${result.error}`);
                console.log(`[ERROR] Error for realm code "${result.realmCode}": ${result.error}`);
            }
        });

        await saveDatabase(database);
    } catch (error) {
        console.error('Error checking Realm code:', error);
        return message.reply('An error occurred while trying to check the Realm code.');
    }
};

async function saveDatabase(database) {
    try {
        if (!Array.isArray(database.realms)) {
            database.realms = [];
        }
        await fsPromises.writeFile(databasePath, JSON.stringify(database, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving database file:', error);
    }
}

async function readDatabase() {
    try {
        const data = await fsPromises.readFile(databasePath, 'utf-8');
        const db = JSON.parse(data.trim());
        if (!Array.isArray(db.realms)) {
            db.realms = [];
        }
        return db;
    } catch (error) {
        console.error('Error reading database file:', error);
        return { realms: [] };
    }
}
