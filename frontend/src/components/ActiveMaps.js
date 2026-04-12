import { Link } from "react-router-dom";
import {useEffect, useState} from "react";
import '../styles/components/ActiveMaps.css';

const ActiveMaps = () => {
    const [leaderboards, setLeaderboards] = useState('');

    useEffect(() => {
        const fetchLeaderboards = async () => {
            const response = await fetch('https://leaderboard-website-api.vercel.app/api/leaderboards');
            const json = await response.json();

            if (response.ok) {
                setLeaderboards(json.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 6));
            }
        }

        fetchLeaderboards();

    }, [])

    const scrollToSearchAndClick = () => {
        const search = document.getElementById("search");
        if (search) {
            search.scrollIntoView({ behavior: "smooth", block: "center" });
            setTimeout(() => {
                search.click();
            }, 500)
        }
    }
    return (
        <div className="active-maps">
            <div className="inside">
                <h2>Active Maps</h2>
                <div className="desc-cnt">
                    <span className="dash"></span>
                    <p>
                        The maps with the latest submissions. Click on a map to view the leaderboard and submit your time!
                    </p>
                </div>
                {leaderboards && leaderboards.length > 0 ? (
                <div className="maps">
                        {leaderboards.map((leaderboard) => (
                            <Link to={`/${leaderboard.steamID}`} className="map" key={leaderboard._id}>
                                <span className="media-container">
                                    <img src={leaderboard.previewImage} alt={`${leaderboard.mapName} preview`} />
                                </span>
                                <div className="map-info">
                                    <h3>{leaderboard.mapName}</h3>
                                    <p className="playerAmount">👤 {leaderboard.entries.length}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p>No active maps found.</p>
                )}
                <div className="btn-container justify-center">
                    <button className="btn btn-primary" onClick={scrollToSearchAndClick}>Search Maps</button>
                </div>
            </div>
        </div>
    );
}
 
export default ActiveMaps;