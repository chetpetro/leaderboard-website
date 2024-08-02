require('dotenv').config({ path: __dirname + '/.env'})

fetch('https://discord.com/api/v9/channels/1046110817986293792/messages', {
    method: "POST",
    body: JSON.stringify({content: "test"}),
    headers: {
        "Authorization": "MzMzNjc3ODk0ODM4NjQ4ODUz.GyQ-cO.M8zruCUQOqfsFCluE_p8BNGjx8zD0h8o8Tl99w" ,
        'Content-Type': 'application/json'
    }
}).then((response) => console.log(response))