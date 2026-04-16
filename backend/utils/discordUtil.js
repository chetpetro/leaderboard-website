const sendDiscordMessage = async (content) => {
    await fetch('https://discord.com/api/v9/channels/1046110817986293792/messages', {
        method: 'POST',
        body: JSON.stringify({
            content
        }),
        headers: {
            Authorization: process.env.DISCORD_TOKEN,
            'Content-Type': 'application/json'
        }
    });
};

module.exports = {
    sendDiscordMessage
};

