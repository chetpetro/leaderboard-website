import { useState, useEffect } from "react";
import {Link, useParams} from "react-router-dom";
import CreateEntryForm from "../components/CreateEntryForm";
import '../styles/LeaderboardDetails.css'
import PlayerPodium from "../components/PlayerPodium";

const LeaderboardDetails = ({user}) => {
    const { steamID } = useParams()
    const [map, setMap] = useState('');

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

    useEffect(() => {
        const fetchMap = async () => {
            const response = await fetch('https://leaderboard-website-api.vercel.app/api/leaderboards/' + steamID)
            const json = await response.json();

            if (response.ok) {
                setMap(json[0]);
            }
        }

        fetchMap();
    }, [steamID])

    return (
        <div className="map-details">
            <div className={"inside"}>
                <div className="col-left">
                    <div className="map-hero">
                        <div className="map-image media-container">
                            <img src={map.previewImage}/>
                        </div>
                        <div className={"map-info"}>
                            <h1 className="details-map-name">{map.mapName || 'Unknown'}</h1>
                            <span className={"map-creator"}>By: { map.creator }</span>
                        </div>
                    </div>
                    <div className="leaderboard map-rankings">
                        {map && map.entries.sort((a, b) => a.time - b.time).map((entry, index) => (
                            <div className={"leaderboard-entry"}>
                                <span className={"placing"}>{index + 1}</span>
                                <Link to={`/user/${entry.discordID}`}>{ entry.userName }</Link>
                                <span>{ msToTime(entry.time) }</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="col-right">
                    <div className="submit-entry card">
                        {!user.userName && <CreateEntryForm steamID={ map.steamID } user={user}/>}
                        {user.userName && <h2>Login to Submit Entry</h2>}
                    </div>
                    <div className="map-details card">
                        <h2 className={"heading-description"}>
                            Description
                        </h2>
                        <p className="description">
                            { map.description }
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
 
export default LeaderboardDetails;