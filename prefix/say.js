exports.run = async (message, args) => {
    if (!args.length) return message.reply('`!say` is a command that echoes your message back using the bot.\n\nSyntax: !say <context>');
    const fixedMessage = args.join(' ').replace(/@/g, '');
    if (!fixedMessage) return message.reply('Pings aren\'t allowed for this command.');
    const messageContent = `**${message.author.tag}:** ${fixedMessage}`;
    
    const allowedAuthors = ['959721082078760964'];
    if (allowedAuthors.includes(message.author.id)) {
        message.channel.send(fixedMessage);
    } else {
        message.channel.send(messageContent);
    }
    message.delete().catch(console.error);
};