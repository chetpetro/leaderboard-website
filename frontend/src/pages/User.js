import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";


const LeaderboardDetails = () => {
    const { discordID } = useParams()
    const [entries, setEntries] = useState('');
    const [user, setUser] = useState('');

    useEffect(() => {
        const fetchEntries = async () => {
            const response = await fetch('/api/user/' + discordID)
            const json = await response.json();

            if (response.ok) {
                setEntries(json.entries)
                setUser(json.user)
            }
        }

        fetchEntries();
    }, [])

    const msToTime = (duration) => {
        var milliseconds = duration.toString().slice(-3);
        var seconds = Math.floor((duration / 1000) % 60);
        var minutes = Math.floor((duration / (1000 * 60)) % 60);
        var hours = Math.floor(duration / (1000 * 60 * 60));

        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;
        hours = (hours < 10) ? "0" + hours : hours;

        return hours + ':' + minutes + ':' + seconds + '.' + milliseconds;
    }

    return (
        <div>
            <h2 className="details-map-name">{ user.userName }</h2>
            <div className="leaderboard-details">
                <div className="leaderboad-entries">
                    {entries && entries.map((map) => (
                        <div className="leaderboard-entry" key={map.mapName}>
                            <p style={{width: "15%"}}>{ map.mapName }</p>
                            <p style={{width: "2%"}}>{ map.pos }</p>
                            <p>{ msToTime(map.entry.time) }</p>
                        </div>
                    ))}
                </div>
                <h4 style={{fontSize: "2em"}}>Points: {user.points}</h4>
            </div>
        </div>
    );
}
 
export default LeaderboardDetails;