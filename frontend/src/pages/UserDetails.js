import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { msToTime } from "../timeUtils";
import '../styles/pages/UserDetails.css'

const UserDetails = () => {
    const { discordID } = useParams()
    const [entries, setEntries] = useState([]);
    const [user, setUser] = useState('');

    useEffect(() => {
        loadUserAndMapSubmission(discordID, setEntries, setUser);
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

async function loadUserAndMapSubmission(discordID, setEntries, setUser) {
    const {user, shouldUpdatePoints} = await fetchUser(discordID);
    if(!user) return;
    setUser(user);

    fetchUserMapEntries(discordID).then(entries => {
        if (!entries) return;
        setEntries(entries);
    })

    if (shouldUpdatePoints) {
        const updatedUser = await updateUserPoints(discordID);
        if (updatedUser) setUser(updatedUser);
    }
}

async function fetchUser(discordID) {
    const response = await fetch('https://leaderboard-website-api.vercel.app/api/user/' + discordID)
    const json = await response.json();

    if (response.ok) {
        return json;
    } else {
        console.error("Failed to fetch user data for discordID:", discordID);
        return null;
    }
}

async function fetchUserMapEntries(discordID) {
    const response = await fetch('https://leaderboard-website-api.vercel.app/api/leaderboards/entries?user=' + discordID);
    const json = await response.json();
    if (response.ok) {
        return json.entries;
    } else {
        console.error("Failed to fetch entries for discordID:", discordID);
        return null;
    }
}

async function updateUserPoints(discordID) {
    const response = await fetch(`https://leaderboard-website-api.vercel.app/api/user/${discordID}/update-points`);
    const json = await response.json();
    if (response.ok) {
        return json.user;
    } else {
        console.error("Failed to fetch user points:", {
            discordID,
            status: response.status,
            error: json?.error,
            message: json?.message,
            endpoint: json?.endpoint,
        });
        return null;
    }
}
 
export default UserDetails;