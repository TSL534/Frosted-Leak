module.exports = (client) => {
    client.handleEvents = async (eventFiles, path) => {
        for (const file of eventFiles) {
            const event = require(`../events/${file}`);
            if (event.once) {
                try {
                client.once(event.name, (...args) => event.execute(...args, client));
                } catch (error) {
                }
            } else {
                try {
                client.on(event.name, (...args) => event.execute(...args, client));
                } catch (error) {
                }
            }
        }
    };
}