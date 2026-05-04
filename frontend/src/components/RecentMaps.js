import { Link } from "react-router-dom";
import {useEffect, useState} from "react";
import '../styles/components/ActiveMaps.css';
import useApi from "../hooks/useApi";

const RecentMaps = () => {
    const api = useApi();
    const [leaderboards, setLeaderboards] = useState([]);

    useEffect(() => {
        const fetchLeaderboards = async () => {
            try {
                const json = await api.leaderboards.fetchRecent(6);
                setLeaderboards(json);
            } catch (error) {
                // Errors are already shown by the API layer.
            }
        }

        fetchLeaderboards();

    }, [api])

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
                <h2>New Maps</h2>
                <div className="dash-container desc-cnt">
                    <span className="dash"></span>
                    <p>
                        The maps with the latest submissions. Click on a map to view the leaderboard and submit your time!
                    </p>
                </div>
                {leaderboards && leaderboards.length > 0 ? (
                <div className="maps">
                        {leaderboards.map((leaderboard) => (
                            <Link to={`/${leaderboard.steamID}`} className="map" key={leaderboard._id}>
                                <div className="map-blurred-bg media-container">
                                    <img src={leaderboard.previewImage} alt="" />
                                </div>
                                <div className="map-img-cnt media-container">
                                    <img src={leaderboard.previewImage} alt={`${leaderboard.mapName} preview`} />
                                </div>
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
 
export default RecentMaps;