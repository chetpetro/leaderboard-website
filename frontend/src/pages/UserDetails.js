import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { msToTime } from "../timeUtils";
import '../styles/pages/UserDetails.css'
import useApi from "../hooks/useApi";

const UserDetails = () => {
    const api = useApi();
    const { discordID } = useParams()
    const [entries, setEntries] = useState([]);
    const [user, setUser] = useState({});

    useEffect(() => {
        const loadUserAndMapSubmission = async () => {
            try {
                const userPayload = await api.user.fetchById(discordID);
                if (!userPayload?.user) return;

                setUser(userPayload.user);

                const entriesPayload = await api.leaderboards.fetchEntriesByUser(discordID);
                if (entriesPayload?.entries) {
                    setEntries(entriesPayload.entries);
                }

                if (userPayload.shouldUpdatePoints) {
                    const updatedPayload = await api.user.updatePoints(discordID);
                    if (updatedPayload?.user) setUser(updatedPayload.user);
                    if (updatedPayload?.entries) setEntries(updatedPayload.entries);
                }
            } catch (error) {
                // Errors are already shown by the API layer.
            }
        };

        loadUserAndMapSubmission();
    }, [api, discordID])
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