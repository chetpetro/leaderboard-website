import {useState, useEffect, useRef, useMemo, useCallback} from "react";
import CreateLeaderboardForm from "../components/CreateLeaderboardForm";
import '../styles/pages/Home.css'
import {Link} from "react-router-dom";
import ActiveMaps from "../components/ActiveMaps";
import PlayerPodium from "../components/PlayerPodium";
import LatestSubmissionsTicker from "../components/LatestSubmissionsTicker.js";
import useApi from "../hooks/useApi";
import {EmoteWheel, playEmote} from "../components/EmoteWheel";

const INVALID_SUBMISSION_DAY_END_UTC = Date.UTC(2026, 3, 12, 0, 0, 0, 0);

const isInvalidSubmissionDay = (timestamp) => {
    return timestamp < INVALID_SUBMISSION_DAY_END_UTC;
};

const Home = () => {
    const api = useApi();

    const [query, setQuery] = useState('');
    const [maps, setMaps] = useState([]);
    const [showCreateLeaderboard, setShowCreateLeaderboard] = useState(false);
    const [searchBarFocused, setSearchBarFocused] = useState(false);
    const [top3Players, setTop3Players] = useState([]);
    const [searchResultHeight, setSearchResultHeight] = useState(0);
    const [mapsInitialized, setMapsInitialized] = useState(false);
    const [motw, setMOTW] = useState('');

    const searchBarRef = useRef(null);
    const searchResultRef = useRef(null);
    const searchInputRef = useRef(null);

    const handleSearchBarClick = () => {
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
        const fetchMOTW = async () => {
            try {
                const json = await api.leaderboards.fetchMOTW();
                const { motwNumber: currentMotwNumber, ...motwData } = json || {};
                setMOTW({
                    ...motwData,
                    motwNumber: currentMotwNumber
                });
            } catch (error) {
                // Errors are already shown by the API layer.
            }
        };

        fetchMOTW();
    }, [api]);

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
        const current = searchResultRef.current;
        return () => {
            resizeObserver.unobserve(current);
        }
    }, [searchResultRef, searchResultHeight]);

    useEffect(() => {
        const fetchMaps = async () => {
            try {
                const json = await api.leaderboards.fetchAll();
                setMaps((json || []).sort((a, b) => b.entries.length - a.entries.length));
            } catch (error) {
                // Errors are already shown by the API layer.
            }
        }

        fetchMaps();
    }, [api, searchBarRef])

    useEffect(() => {
        if (maps.length === 0) return;
        setTimeout(() => setMapsInitialized(true), 50); // ik this isnt nice, but request animationFrame sometimes doesn't work here :(
    }, [maps]);

    useEffect(() => {
        if (mapsInitialized) {
            setTimeout(() => searchBarRef.current.style.setProperty('--transitionTime', '.75s'), 50)
            return;
        }
        searchBarRef.current.style.setProperty('--search-input-height', searchInputRef.current.offsetHeight + 'px');

    }, [mapsInitialized, searchInputRef, searchBarRef]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const json = await api.user.fetchTop3();
                setTop3Players(json);
            } catch (error) {
                // Errors are already shown by the API layer.
            }
        }

        fetchUsers();
    }, [api])

    const latestSubmissions = useMemo(() => {
        return maps
            .flatMap((map) => {
                const entries = Array.isArray(map.entries) ? map.entries : [];
                return entries.map((entry, index) => {
                    const submittedTimestamp = entry?.submittedAt ? new Date(entry.submittedAt).getTime() : 0;
                    return {
                        ...entry,
                        mapName: map.mapName,
                        steamID: map.steamID,
                        submittedTimestamp: Number.isFinite(submittedTimestamp) ? submittedTimestamp : 0,
                        key: `${map._id || map.steamID}-${entry.discordID || entry.userName || 'entry'}-${index}`
                    };
                });
            })
            .filter((entry) => !isInvalidSubmissionDay(entry?.submittedTimestamp))
            .sort((a, b) => b.submittedTimestamp - a.submittedTimestamp)
            .slice(0, 10);
    }, [maps]);
    const junker = useRef()
    const handleEmoteEvent = useCallback((emoteType) => {
            playEmote(emoteType, junker.current)
    }, [junker])
    return (
        <div className="home">
            <LatestSubmissionsTicker submissions={latestSubmissions} />
            <div className={"teaser"}>
                <div className="pogo-char junker media-container" ref={junker}>
                    <div className="slide-in">
                        <img src="/junker.png" alt={"Pogostuck character of junker"}/>
                    </div>
                    <EmoteWheel
                        onEmoteEvent={handleEmoteEvent}
                    />
                </div>
                <div className="pogo-char cheeb media-container">
                    <div className="slide-in">
                        <img src="/cheeb.png" alt={"Pogostuck character of cheeb"}/>
                    </div>
                </div>
                <div className={"inside"}>
                    <h1>Ascend the <span className="text-gradient">Custom-Map</span> Ranks</h1>
                    <p className="text-muted teaser-text">Compare and Submit your leaderboards times for all custom-maps</p>
                    <div className="search-bar-with-placeholder-wrapper placeholder-wrapper" ref={searchBarRef}>
                        <div className={"search-bar-placeholder placeholder" + (mapsInitialized ? '' : ' is-loading maps-not-initialized')}>
                             <div className="placeholder-icon">
                                 <div className="block-left with-border block placeholder-block placeholder-block-left with-border"></div>
                                 <div className="block-right block placeholder-block placeholder-block-right with-border-block"></div>
                                 <div className="block-top block placeholder-block placeholder-block-top with-border"></div>
                                 <div className="block-bottom block placeholder-block placeholder-block-bottom with-border"></div>
                             </div>
                            <div className="placeholder-search">
                                <div className="block-left block placeholder-block placeholder-block-left with-border-block"></div>
                                <div className="block-right block placeholder-block placeholder-block-right with-border"></div>
                                <div className="block-top block placeholder-block placeholder-block-top with-border"></div>
                                <div className="block-bottom block placeholder-block placeholder-block-bottom with-border"></div>
                            </div>
                        </div>
                        <div    className={'search-bar placeholder-target ' + (searchBarFocused ? 'focused' : '') + (mapsInitialized ? '' : ' maps-not-initialized is-loading')}
                                onClick={handleSearchBarClick} onFocus={() => setSearchBarFocused(true)}>
                            <div className="search-inside">
                                <div className="input-with-icon-cnt">
                                    <button className="media-container btn-clear">
                                        <img src="/search-icon.svg" alt="search-icon" />
                                    </button>
                                    <input type="text" placeholder="Search for a map..." onChange={(e) => {
                                        setQuery(e.target.value);
                                    }} value={query} ref={searchInputRef} id={"search"}/>
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
                                                <Link to={`/${map.steamID}`} className="result-map" key={map._id} title={`${map.mapName}`}>
                                                    <div className="media-container">
                                                        <img src={map.previewImage} alt={`${map.mapName} preview`} />
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

                    </div>
                    <button className="create-map" onClick={() => setShowCreateLeaderboard(!showCreateLeaderboard)}>
                        Can't find a Map? Submit the Map here!
                    </button>
                    <CreateLeaderboardForm show={showCreateLeaderboard}/>
                    <div className="cards">
                        <Link to={'/map-of-the-week'} className={'card map-of-the-week animate-hover ' + (motw ? '' : 'hidden')}>
                            <span className="icon-cnt text-gradient media-container">
                                <div className={"media-container"}>
                                     <img src="/crown.svg" alt="crown" />
                                </div>
                            </span>
                            <div className="card-content">
                                <h2>Map of the Week</h2>
                                <p>{motw.mapName || "No map selected"}</p>
                            </div>
                            <span className="card-link">
                                <div className={"media-container"}>
                                    <img src="/arrow-right.svg" alt="arrow-right" />
                                </div>
                            </span>
                        </Link>
                        <Link to={`/hardest-maps`} className={'card hardest-maps-card animate-hover ' + (motw ? '' : 'hidden')}>
                            <span className="icon-cnt text-gradient media-container">
                                <div className={"media-container"}>
                                     <img src="/hot_pepper.png" alt="hot pepper" />
                                </div>
                            </span>
                            <div className="card-content">
                                <h2>Hardest Maps</h2>
                                <p>Good luck o7</p>
                            </div>
                            <span className="card-link">
                                <div className={"media-container"}>
                                    <img src="/arrow-right.svg" alt="arrow-right" />
                                </div>
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
            <PlayerPodium players={top3Players.map(player => ({
                _id: player._id,
                userName: player.userName,
                discordID: player.discordID,
                value: player.totalMapPoints + " pts"
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