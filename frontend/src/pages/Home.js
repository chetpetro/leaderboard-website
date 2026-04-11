import { useState, useEffect } from "react";
import CreateLeaderboardForm from "../components/CreateLeaderboardForm";
import '../styles/home/Home.css'
import {Link} from "react-router-dom";
import ActiveMaps from "../components/ActiveMaps";
import PlayerPodium from "../components/PlayerPodium";

const Home = ({motw}) => {
    const [leaderboards, setLeaderboards] = useState('');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);
    const elementsPerPage = 15;
    const [showCreateLeaderboard, setShowCreateLeaderboard] = useState(false);

    const [top3Players, setTop3Players] = useState([]);

    const handleSearchBarClick = (e) => {
        e.currentTarget.querySelector('input').focus();
    }

    useEffect(() => {
        const fetchLeaderboards = async () => {
            const response = await fetch('https://leaderboard-website-api.vercel.app/api/leaderboards');
            const json = await response.json();

            if (response.ok) {
                setLeaderboards(json);
            }
        }
        const fetchUsers = async () => {
            const response = await fetch('https://leaderboard-website-api.vercel.app/api/user/')
            const json = await response.json();

            if (response.ok) {
                setTop3Players(json.slice(0, 3));
            }
        }

        fetchUsers();
        fetchLeaderboards();

    }, [])
    
    return (
        <div className="home">
            <div className="teaser">
                <div className="inside">
                    <h1>Ascend the <span className="text-gradient">Custom-Map</span> Ranks</h1>
                    <p className="text-muted teaser-text">Compare and Submit your leaderboards times for all custom-maps</p>
                    <div className="search-bar" onClick={handleSearchBarClick}>
                        <input type="text" placeholder="Search for a map..." onChange={(e) => {
                            setQuery(e.target.value);
                            setPage(0)
                        }} value={query}/>
                    </div>
                    <a className="create-map" onClick={() => setShowCreateLeaderboard(!showCreateLeaderboard)}>
                        Can't find a Map? Submit the Map here!
                    </a>
                    <CreateLeaderboardForm show={showCreateLeaderboard}/>
                    <Link to={`/${motw.steamID}`} className={'card map-of-the-week' + (motw.mapName ? '' : ' hidden')}>
                        <span className="icon-cnt text-gradient">⚫</span>
                        <div className="card-content">
                            <h2>Map of the Week</h2>
                            <p>{motw.mapName || "No map selected"}</p>
                        </div>
                        <span className="card-link" to={`/${motw.steamID}`}>
                            <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg" className="arrow-icon">
                                <path d="M0 0 L10 5 L0 10 Z" fill="currentColor" />
                            </svg>
                        </span>
                    </Link>
                </div>
            </div>
            <ActiveMaps/>
            <PlayerPodium players={top3Players.map(player => ({
                _id: player._id,
                userName: player.userName,
                discordID: player.discordID,
                value: player.points + " pts"
            }))}/>
            <div className="see-all-players bg-primary">
                <div className="inside">
                    <div className="btn-container">
                        <Link to={'/points-leaderboard'} className="btn btn-gray">See All Players</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
 
export default Home;