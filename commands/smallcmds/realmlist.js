const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Authflow } = require('prismarine-auth');
const { RealmAPI } = require('prismarine-realms');
const fs = require('node:fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('realmlist')
    .setIntegrationTypes(0, 1)
    .setContexts(0, 1, 2)
    .setDescription('Lists all realms in your realm list with their IDs.')
    .addIntegerOption(option =>
      option.setName('account')
          .setDescription('Account you wanna use')
          .setRequired(true)
          .addChoices(
              { name: 'Account 1', value: 1 },
              { name: 'Account 2', value: 2 },
              { name: 'Account 3', value: 3 })),

  execute: async (interaction) => {
    try {
      await interaction.deferReply({ ephemeral: true });
      const account = interaction.options.getInteger('account')
      const profilesFolder = `./data/client/frosted/${interaction.user.id}/profile${account}`;
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

      const usersFilePath = './data/client/users.json';
      if (!fs.existsSync(usersFilePath)) {
        throw new Error('No user data found. Please link your account first.');
      }

      const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
      

      const authFlow = new Authflow(interaction.user.id, profilesFolder);

      const realmsList = await listRealms(authFlow);

      if (realmsList.errorMsg) {
        throw new Error(realmsList.errorMsg);
      }

      let page = 0;
      const itemsPerPage = 5;
      const totalPages = Math.ceil(realmsList.length / itemsPerPage);

      const generateEmbed = (start) => {
        const current = realmsList.slice(start, start + itemsPerPage);

        const embed = new EmbedBuilder()
          .setTitle('Realms List')
          .setDescription(
            current.map((realm) => `**Name**: ${realm.name}\n**ID**: ${realm.id}\n**Status**: ${realm.state === 'OPEN' ? 'Open' : 'Closed'}`).join('\n\n')
          )
          .setFooter({ text: `Page ${page + 1} of ${totalPages}` });

        return embed;
      };

      const generateActionRow = (locked = false) => {
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('previous')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(locked || page === 0),
          new ButtonBuilder()
            .setCustomId('stop')
            .setLabel('Stop')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🛑'),
          new ButtonBuilder()
            .setCustomId('next')
            .setLabel('Next')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(locked || page === totalPages - 1)
        );
      };

      const embedMessage = await interaction.editReply({
        embeds: [generateEmbed(0)],
        components: [generateActionRow()],
      });

      const filter = (i) => i.user.id === interaction.user.id;
      const collector = embedMessage.createMessageComponentCollector({ filter, time: 60000 });

      collector.on('collect', async (i) => {
        if (i.customId === 'previous' && page > 0) {
          page--;
        } else if (i.customId === 'next' && page < totalPages - 1) {
          page++;
        } else if (i.customId === 'stop') {
          collector.stop();
          await i.update({
            embeds: [generateEmbed(page * itemsPerPage)],
            components: [],
          });
          return;
        }

        await i.update({
          embeds: [generateEmbed(page * itemsPerPage)],
          components: [generateActionRow()],
        });
      });

      collector.on('end', () => {
        interaction.editReply({
          components: [
            generateActionRow(true), 
          ],
        });
      });
    } catch (e) {
      console.error('Error executing command:', e);
      const errorEmbed = new EmbedBuilder().setDescription(`Error fetching realms list: ${e.message || e}`);
      interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};

async function listRealms(authFlow) {
  const api = RealmAPI.from(authFlow, 'bedrock');

  try {
    return await api.getRealms();
  } catch (error) {
    throw new Error('Could not retrieve realms list');
  }
}
