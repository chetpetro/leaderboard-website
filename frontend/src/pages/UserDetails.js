import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { msToTime } from "../timeUtils";
import '../styles/pages/UserDetails.css'


const UserDetails = () => {
    const { discordID } = useParams()
    const [entries, setEntries] = useState([]);
    const [user, setUser] = useState('');

    useEffect(() => {
        const fetchEntries = async () => {
            const response = await fetch('https://leaderboard-website-api.vercel.app/api/user/' + discordID)
            const json = await response.json();

            if (response.ok) {
                const entries = json.entries.sort((a, b) => a.pos - b.pos)
                setEntries(entries)
                setUser(json.user)
                console.log("recalculated:", json.recalculated, "\n\n")
                console.log(json)
            }
        }

        fetchEntries();
    }, [discordID])
    // TODO manche mappoints werden falsch berechnet (siehe har) & refactor of method generation string (automatisch)
    useEffect(() => {
        console.log("mapPoints", user.mapPoints)
        console.log(user)
    }, [user]);


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
                    {entries.map((map) => (
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
 
export default UserDetails;