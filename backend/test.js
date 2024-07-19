
const url = "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=73A7B076566AD80DF796828984EFFD37&steamids=76561199054628134"
const mapID = getID(url)
const API_KEY = process.env.STEAM_API_KEY

let mapData = new FormData();
mapData.append('itemcount', '1');
mapData.append('publishedfileids[0]', mapID)

const mapResponse = await fetch(`https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/`, {
    method:"POST",
    body: mapData
});
const mapJson = await mapResponse.json();
const mapInfo = mapJson.response.publishedfiledetails[0];

const playerResponse = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=73A7B076566AD80DF796828984EFFD37&steamids=76561199054628134`);
const playerJson = await playerResponse.json();

const colour = await getAverageColor(mapInfo.preview_url);

mapEntry = { 
    mapName: mapInfo.title,
    creator: playerJson.response.players[0].personaname,
    description: mapInfo.description,
    previewImage: mapInfo.preview_url,
    colour,
    entries
}