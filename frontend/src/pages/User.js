import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";


const LeaderboardDetails = () => {
    const { discordID } = useParams()
    const [entries, setEntries] = useState('');
    const [user, setUser] = useState('');

    useEffect(() => {
        const fetchEntries = async () => {
            const response = await fetch('https://leaderboard-website-api.vercel.app/api/user/' + discordID)
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
                <table className="leaderboad-entries">
                    {entries && entries.sort((a,b) => a.pos - b.pos).map((map) => (
                        <tr className="leaderboard-entry" key={map.steamID}>
                            <td><Link to={`/${map.steamID}`}><td >{ map.mapName }</td></Link></td>
                            <td >{ map.pos }</td>
                            <td>{ msToTime(map.entry.time) }</td>
                        </tr>
                    ))}
                </table>
                <h4 style={{fontSize: "2em"}}>Points: {user.points}</h4>
            </div>
        </div>
    );
}
 
export default LeaderboardDetails;