const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const fsPromises = require('fs').promises;
const config = require('../../data/discord/config.json');



module.exports = {
    data: new SlashCommandBuilder()
        .setName('gambling')
        .setDescription('slot machine')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2),
    async execute(interaction) {
        await interaction.reply({ embeds: [
            new EmbedBuilder()
                .setTitle('Frosted Loading')
                .setDescription(`Checking data, this may take a second depending on how much is been handled.`)
                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                .setThumbnail(config.embeds.footerurl)
                .setColor(config.embeds.color)
        ] 
        })
        const userId = interaction.user.id;
        let user = userId

        const symbols = ['🍒', '🍋', '🍊', '⭐', '7️⃣'];

        const embed = new EmbedBuilder()
            .setTitle(` Slot Machine `)
            .setDescription('Initial Result:\n' + generateRandomGrid(symbols));

        // Send the initial embed
        await interaction.editReply({ embeds: [embed] });

        // Store final results
        let finalResults = [[], [], []];

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 5; j++) {
                const spinningResults = [
                    symbols[Math.floor(Math.random() * symbols.length)],
                    symbols[Math.floor(Math.random() * symbols.length)],
                    symbols[Math.floor(Math.random() * symbols.length)],
                ];

                embed.setDescription(`Spinning ${i + 1}...\n${generateGrid(finalResults, i, spinningResults)}`);
                await interaction.editReply({ embeds: [embed] });
                await new Promise(resolve => setTimeout(resolve, 500)); // Wait for 500ms bc discord embeds are slow
            }

            finalResults[i] = [
                symbols[Math.floor(Math.random() * symbols.length)],
                symbols[Math.floor(Math.random() * symbols.length)],
                symbols[Math.floor(Math.random() * symbols.length)],
            ];
        }

        const finalResultText = finalResults[0].map((_, colIndex) => 
            finalResults.map(row => row[colIndex]).join(' ')
        ).join('\n');

        let coinsWon = 0;

        for (let col of finalResults) {
            if (col[0] === '7️⃣' && col[1] === '7️⃣' && col[2] === '7️⃣') {
                coinsWon = 500; // Win for 3 7s ( lowkey dosent work :3 )
                break;
            }
        }

        if (coinsWon > 0) {
            user.coins += coinsWon;
            embed.setDescription(`🎉 You won ${coinsWon} coins! 🎉\nFinal Result:\n${finalResultText}`);
        } else {
            user.coins -= 0; 
            embed.setDescription(`😢 You lost 0 coins.\nFinal Result:\n${finalResultText}`);
        }

        
        await interaction.editReply({ embeds: [embed] });
    },
};

function generateRandomGrid(symbols) {
    return [
        [symbols[Math.floor(Math.random() * symbols.length)], symbols[Math.floor(Math.random() * symbols.length)], symbols[Math.floor(Math.random() * symbols.length)]],
        [symbols[Math.floor(Math.random() * symbols.length)], symbols[Math.floor(Math.random() * symbols.length)], symbols[Math.floor(Math.random() * symbols.length)]],
        [symbols[Math.floor(Math.random() * symbols.length)], symbols[Math.floor(Math.random() * symbols.length)], symbols[Math.floor(Math.random() * symbols.length)]],
    ].map(row => row.join(' ')).join('\n');
}

function generateGrid(finalResults, currentColumn, spinningResults) {
    const grid = [];
    for (let row = 0; row < 3; row++) {
        const currentRow = [];
        for (let col = 0; col < 3; col++) {
            if (col === currentColumn) {
                currentRow.push(spinningResults[row]); 
            } else {
                currentRow.push(finalResults[col][row] || '❓'); 
            }
        }
        grid.push(currentRow);
    }
    return grid.map(row => row.join(' ')).join('\n');
}
