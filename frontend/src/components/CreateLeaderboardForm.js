import { useState } from "react";

const CreateLeaderboardForm = () => {
    const [mapName, setMapName] = useState('');
    const [creator, setCreator] = useState('');
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMapName(mapName.replace('-', ' '))
        if (mapName === '') return;

        const check = await fetch('/api/leaderboards/' + mapName);
        const json = await check.json();
        if (json.length !== 0) return console.log("Map already exists")

        const leaderboard = { mapName, creator, entries: []};
        fetch('/api/leaderboards/', {
            method: "POST",
            body: JSON.stringify(leaderboard),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(() => {
            setMapName('');
            setCreator('')
        }).catch((err) => console.log(err));
    }

    return (
        <form className="create-leaderboard-form" onSubmit={handleSubmit}>
            <label>Map Name:</label>
            <input type="text" onChange={(e) => setMapName(e.target.value)} value={mapName}/>
            <label>Creator:</label>
            <input type="text" onChange={(e) => setCreator(e.target.value)} value={creator}/>
            <button>Add</button>
        </form>
    );
}
 
export default CreateLeaderboardForm;