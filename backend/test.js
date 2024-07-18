const test = require('dotenv').config({ path: __dirname + '/.env'})
API_KEY = process.env.STEAM_API_KEY

const result = async () => {
    
    let formData = new FormData();
    formData.append('itemcount', '1');
    formData.append('publishedfileids[0]', '2895321821')


    const response = await fetch(`https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/`, {
        method:"POST",
        body: formData
    });
    const json = await response.json();

    console.log(json.response.publishedfiledetails[0])

    creator = json.response.publishedfiledetails[0].creator
    let playerData = new FormData();
    playerData.append('key', API_KEY);
    playerData.append('steamids', creator)

    const playerResponse = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${API_KEY}&steamids=${creator}`);
    const playerjson = await playerResponse.json();

    playerjson.response.players[0].personaname
    

}

result();