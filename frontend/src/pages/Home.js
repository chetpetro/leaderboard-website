import {useState, useEffect, useRef} from "react";
import CreateLeaderboardForm from "../components/CreateLeaderboardForm";
import '../styles/home/Home.css'
import {Link} from "react-router-dom";
import ActiveMaps from "../components/ActiveMaps";
import PlayerPodium from "../components/PlayerPodium";

const Home = ({motw}) => {

    const [query, setQuery] = useState('');
    const [maps, setMaps] = useState([]);
    const [showCreateLeaderboard, setShowCreateLeaderboard] = useState(false);
    const [searchBarFocused, setSearchBarFocused] = useState(false);
    const [top3Players, setTop3Players] = useState([]);
    const [searchResultHeight, setSearchResultHeight] = useState(0);
    const [mapsInitialized, setMapsInitialized] = useState(false);

    const searchBarRef = useRef(null);
    const searchResultRef = useRef(null);
    const searchInputRef = useRef(null);

    const handleSearchBarClick = (e) => {
        searchInputRef.current.focus();
    }

    useEffect(() => {
        if (!searchResultRef.current) return;
        // resizeObserver to track the searchResultHeight of the searchResultRef
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.target === searchResultRef.current) {
                    setSearchResultHeight(entry.contentRect.height);
                }
            }
        });
        resizeObserver.observe(searchResultRef.current);

        return () => {
            if (searchResultRef.current) {
                resizeObserver.unobserve(searchResultRef.current);
            }
        }
    }, [searchResultRef, searchResultHeight]);

    useEffect(() => {
        const fetchMaps = async () => {
            const response = await fetch('https://leaderboard-website-api.vercel.app/api/leaderboards');
            const json = await response.json();

            if (response.ok) {
                setMaps(json.sort((a, b) => b.entries.length - a.entries.length));
                requestAnimationFrame(() => setTimeout(() => setMapsInitialized(true), 1500))
            }
        }

        fetchMaps();
    }, [])

    useEffect(() => {
        if (mapsInitialized) return;
        searchBarRef.current.style.setProperty('--search-input-height', searchInputRef.current.offsetHeight + 'px');

    }, [mapsInitialized, searchInputRef, searchBarRef]);

    useEffect(() => {
        const fetchUsers = async () => {
            const response = await fetch('https://leaderboard-website-api.vercel.app/api/user/')
            const json = await response.json();

            if (response.ok) {
                setTop3Players(json.slice(0, 3));
            }
        }

        fetchUsers();
    }, [])
    
    return (
        <div className="home">
            <div className={"teaser"}>
                <div className={"inside"}>
                    <h1>Ascend the <span className="text-gradient">Custom-Map</span> Ranks</h1>
                    <p className="text-muted teaser-text">Compare and Submit your leaderboards times for all custom-maps</p>
                    <div className="search-bar-with-placeholder-wrapper" ref={searchBarRef}>
                        <div className={"search-bar-placeholder " + (mapsInitialized ? '' : 'maps-not-initialized')}>
                             <div className="placeholder-icon">
                                 <div className="block block-left"></div>
                                 <div className="block block-right"></div>
                                 <div className="block block-top"></div>
                                 <div className="block block-bottom"></div>
                             </div>
                            <div className="placeholder-search">
                                <div className="block block-left"></div>
                                <div className="block block-right"></div>
                                <div className="block block-top"></div>
                                <div className="block block-bottom"></div>
                            </div>
                        </div>
                        <div    className={'search-bar ' + (searchBarFocused ? 'focused' : '') + (mapsInitialized ? '' : ' maps-not-initialized')}
                                onClick={handleSearchBarClick} onFocus={() => setSearchBarFocused(true)}>
                            <div className="input-with-icon-cnt">
                                <button className="media-container btn-clear">
                                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                            <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stop-color="var(--color-primary-100)"/>
                                                <stop offset="50%" stop-color="var(--color-primary-600)"/>
                                                <stop offset="100%" stop-color="var(--color-primary-300)"/>
                                            </linearGradient>
                                        </defs>
                                        <path stroke="url(#icon-gradient)" strokeWidth="3px" fill="transparent" d="M15.7955 15.8111L21 21M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z"/>
                                    </svg>
                                </button>
                                <input type="text" placeholder="Search for a map..." onChange={(e) => {
                                    setQuery(e.target.value);
                                }} value={query} ref={searchInputRef}/>
                            </div>
                            <div className={"search-results"} ref={searchResultRef}
                                 style={{'--search-result-height': -1 * searchResultHeight + 'px'}}>
                                <div className={"maps"}>
                                {maps
                                        .filter((el) => el.mapName.toLowerCase()
                                            .includes(query.toLowerCase()))
                                        .slice(0, 4)
                                        .map(map => (
                                            <Link to={`/${map.steamID}`} className="result-map" key={map._id}>
                                                <div className="media-container">
                                                    <img src={map.previewImage}/>
                                                </div>
                                                {map.featured && <h4 style={{color: "gold"}}>{ map.mapName }</h4>}
                                                {!map.featured && <h4>{ map.mapName }</h4>}
                                                <p>Creator: { map.creator }</p>
                                            </Link>
                                        ))}
                                </div>
                            </div>
                        </div>

                    </div>
                    <button className="create-map" onClick={() => setShowCreateLeaderboard(!showCreateLeaderboard)}>
                        Can't find a Map? Submit the Map here!
                    </button>
                    <CreateLeaderboardForm show={showCreateLeaderboard}/>
                    <Link to={`/${motw.steamID}`} className={'card map-of-the-week animate-hover'}>
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