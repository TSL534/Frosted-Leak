const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const path = require('path');
// you will need to chnaged thise userid
const allowedUsers = ['959721082078760964', '987654321098765432']; 

const databasePath = './data/client/users.json'

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-beta-tester')
        .setDescription('Set a user as a beta tester.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to set as beta tester')
                .setRequired(true)),
    async execute(interaction) {
        if (!allowedUsers.includes(interaction.user.id)) {
            return interaction.reply({
                content: 'You are not authorized to use this command.',
                ephemeral: true,
            });
        }

        const targetUser = interaction.options.getUser('user');
        const userId = targetUser.id;

        let database;
        try {
            database = JSON.parse(fs.readFileSync(databasePath, 'utf8'));
        } catch (error) {
            return interaction.reply({
                content: 'Failed to load the database.',
                ephemeral: true,
            });
        }

        if (!database[userId]) {
            database[userId] = {
                linked: false,
                commands: [],
                xbox: {},
            };
        }

        database[userId].frosted.betatester = true;

        try {
            fs.writeFileSync(databasePath, JSON.stringify(database, null, 4));
        } catch (error) {
            return interaction.reply({
                content: 'Failed to update the database.',
                ephemeral: true,
            });
        }

        return interaction.reply({
            content: `Successfully set ${targetUser.tag} as a beta tester.`,
        });
    },
};
