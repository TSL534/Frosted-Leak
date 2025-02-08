const fs = require('fs');
const path = require('path');

const arasrFilePath = path.join(__dirname, '..', 'data', 'discord', 'arasr.json');

function loadArasrData() {
    try {
        return JSON.parse(fs.readFileSync(arasrFilePath, 'utf-8'));
    } catch (error) {
        console.error('Error loading ARASR file:', error);
        return { users: [] };
    }
}

function saveArasrData(data) {
    try {
        fs.writeFileSync(arasrFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving ARASR file:', error);
    }
}

exports.run = async (message, args) => {
    if (!args[0] || !args[1]) {
        return message.reply('`!addaras` is a command to add a user to ARASR.\n\nSyntax: !addaras <user-id> <reason>');
    }

    const userId = args[0];
    const reason = args.slice(1).join(' ');

    const arasrData = loadArasrData();

    const existingUser = arasrData.users.find(user => user.id === userId);
    if (existingUser) {
        return message.reply(`User with ID **${userId}** is already in the ARASR list for reason: **${existingUser.reason}**`);
    }

    arasrData.users.push({ id: userId, reason });
    saveArasrData(arasrData);

    message.reply(`Successfully added user with ID **${userId}** to the ARASR list for reason: **${reason}**`);

   
};
