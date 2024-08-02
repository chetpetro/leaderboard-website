const steamID = 333677894838648853
require('dotenv').config({ path: __dirname + '/.env'})


fetch('https://discord.com/api/v9/channels/1046110817986293792/messages', {
    method: "POST",
    body: JSON.stringify({content: `<@${steamID}> set a new PB of ${"100"} on ${"test"}!`}),
    headers: {
        "Authorization":  process.env.DISCORD_TOKEN,
        'Content-Type': 'application/json'
    }
}).then((response) => console.log(response))