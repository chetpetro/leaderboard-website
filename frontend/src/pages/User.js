import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import '../styles/User.css'


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
    }, [discordID])

    const msToTime = (duration) => {
        var milliseconds = duration.toString().slice(-3);
        var seconds = Math.floor((duration / 1000) % 60);
        var minutes = Math.floor((duration / (1000 * 60)) % 60);
        var hours = Math.floor(duration / (1000 * 60 * 60));

        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;
        hours = (hours < 10) ? "0" + hours : hours;
        hours = hours === "00" ? "" : hours + ":";
        minutes = hours === "" && minutes === "00" ? "" : minutes + ":";

        return hours + minutes + seconds + '.' + milliseconds;
    }

    return (
        <div className="user">
            <div className="hero">
                <div className="inside">
                    <h1 className="details-map-name text-gradient">{ user.userName }</h1>
                    <span className="user-points">{user.points}</span>
                </div>
            </div>
            <div className="leaderboad-entries">
                <div className="inside leaderboard">
                    {entries && entries.sort((a,b) => a.pos - b.pos).map((map) => (
                        <div className="leaderboard-entry" key={map.steamID}>
                            <span className={"map-placing map-pos-" + map.pos}>
                                { map.pos }
                            </span>
                            <Link to={`/${map.steamID}`}>{ map.mapName }</Link>
                            <span className="time">{ msToTime(map.entry.time) }</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
 
export default LeaderboardDetails;