import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import '../styles/pages/User.css'
import { msToTime } from "../timeUtils";


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
                            <Link to={`/${map.steamID}`} className="map-link">{ map.mapName }</Link>
                            <span className="time">{ msToTime(map.entry.time) }</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
 
export default LeaderboardDetails;