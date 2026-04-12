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
        const handleClickOutside = (event) => {
            if (searchBarRef.current && !searchBarRef.current.contains(event.target)) {
                setSearchBarFocused(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
    }, []);

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
                                    <img src="/search-icon.svg" alt="search-icon" />
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
                                            .includes(query.toLowerCase()) ||
                                            el.creator.toLowerCase().includes(query.toLowerCase()))
                                        .slice(0, 6)
                                        .map(map => (
                                            <Link to={`/${map.steamID}`} className="result-map" key={map._id}>
                                                <div className="media-container">
                                                    <img src={map.previewImage}/>
                                                </div>
                                                <div className={"result-map-info"}>
                                                    {map.featured && <span className="map-name text-gradient">{ map.mapName }</span>}
                                                    {!map.featured && <span className={"map-name"}>{ map.mapName }</span>}
                                                    <span className={"creator"}>By: { map.creator }</span>
                                                </div>
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
                    <Link to={`/${motw.steamID}`} className={'card map-of-the-week animate-hover ' + (motw ? '' : 'hidden')}>
                        <span className="icon-cnt text-gradient media-container">
                            <div className={"media-container"}>
                                 <img src="/crown.svg" alt="crown" />
                            </div>
                        </span>
                        <div className="card-content">
                            <h2>Map of the Week</h2>
                            <p>{motw.mapName || "No map selected"}</p>
                        </div>
                        <span className="card-link" to={`/${motw.steamID}`}>
                            <div className={"media-container"}>
                                <img src="/arrow-right.svg" alt="arrow-right" />
                            </div>
                        </span>
                    </Link>
                </div>
            </div>
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
            <ActiveMaps/>
        </div>
    );
}
 
export default Home;