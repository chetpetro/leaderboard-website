import { useState, useEffect, useCallback } from "react";
import {Link, useParams} from "react-router-dom";
import CreateEntryForm from "../components/CreateEntryForm";
import ChangeDifficultyBonusForm from "../components/ChangeDifficultyBonusForm";
import '../styles/pages/MapDetails.css'
import { msToTime } from "../timeUtils";
import { useError } from '../context/ErrorContext';
import useAdminAuthorization from '../hooks/useAdminAuthorization';
import useApi from '../hooks/useApi';
import { getMapKey } from "../utils/mapUtils";
import { compareEntries } from "../utils/entryUtils";

const MapDetails = ({user}) => {
    const api = useApi();
    const { mapKey: routeMapKey, steamID } = useParams()
    const mapKey = routeMapKey || steamID;
    const [map, setMap] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { showError } = useError();
    const { isAuthorized: isAdminAuthorized } = useAdminAuthorization(user);

    const fetchMap = useCallback(async () => {
        try {
            const json = await api.leaderboards.fetchByMapKey(mapKey);

            if (!Array.isArray(json) || !json[0]) {
                showError('Failed to load map details');
                setIsLoading(false);
                return;
            }

            setMap(json[0]);
            setIsLoading(false);
        } catch (error) {
            // Errors are already shown by the API layer.
            setIsLoading(false);
        }
    }, [api, mapKey, showError]);


    useEffect(() => {
        fetchMap();
    }, [fetchMap])

    const handleDeleteEntry = async (entry) => {
        if (!user?.token) return;
        const confirmed = window.confirm(`Are you sure you want to delete this entry?\n${entry.userName} - ${msToTime(entry.time)}`);
        if (!confirmed) return;

        try {
            await api.admin.deleteEntry(getMapKey(map), entry.discordID, user.token);

            setMap((prev) => {
                return {
                    ...prev,
                    entries: (prev.entries || []).filter((entryEl) => entryEl.discordID !== entry.discordID)
                };
            });

            // Recompute map points after deletion
            await api.admin.recomputeMapPoints(getMapKey(map), user.token);
        } catch (error) {
            // Errors are already shown by the API layer.
        }
    };


    const handleDeleteMap = async () => {
        if (!user?.token || !mapKey) return;
        const confirmed = window.confirm(`Are you sure you want to delete this map and all entries?\n${map?.mapName || 'this map'}`);
        if (!confirmed) return;

        try {
            await api.admin.deleteMap(getMapKey(map), user.token);
            // simple redirect to home after deletion
            window.location.href = '/';
        } catch (error) {
            // Errors handled by API layer
        }
    };

    const handleLogPointsClick = async () => {
        if (!mapKey || !user?.token) return;

        try {
            const response = await api.admin.logMapPoints(mapKey, user.token);
            console.log(response);
        } catch (error) {
            // Errors are already shown by the API layer.
        }
    }


    return (
        <div className="map-details">
            <div className={"inside"}>
                <div className="col-left">
                    <div className={"map-hero-placeholder placeholder-wrapper"}>
                        <div className={"map-hero placeholder-target" + (isLoading ? ' is-loading' : '')}>
                            <div className="map-image media-container">
                                <img src={map?.previewImage} alt={`${map?.mapName || 'Map'} preview`} />
                            </div>
                                <img src={map?.previewImage} alt={""} className={"bg-blurred-img"}/>
                            <div className={"map-info"}>
                                    <h1 className="details-map-name">{map?.mapName || 'Unknown'}</h1>
                                <div className="details">
                                        <span className={"map-creator"}>By: { map?.creator }</span>
                                        {map?.difficultyBonus > 0 && (<div className="difficulty-bonus-cnt">
                                        <div className="hot_pepper media-container"><img src="/hot_pepper.png" alt=""/></div><span className="bonus">+{map?.difficultyBonus}</span>
                                    </div>)}
                                        {map?.isBoostless && (<span className="boostless-badge" title="Boostless map: ranked by fewest boosts, then fastest time">Boostless</span>)}
                                </div>
                            </div>
                                {!map?.isCustomLeaderboard && (
                                    <a className="steam-btn btn btn-small" title={`View ${map?.mapName} on Steam`} href={`https://steamcommunity.com/sharedfiles/filedetails/?id=${getMapKey(map)}`} target="_blank" rel="noopener noreferrer">
                                        <div className="media-container">
                                            <img src={"/Steam.svg"} alt="Steam Icon" className="steam-icon" />
                                        </div>
                                    </a>
                                )}
                            </div>
                        <div className={"placeholder" + (isLoading ? ' is-loading' : '')}>
                            <div className={"placeholder-image"}>
                                <div className="placeholder-block placeholder-block-left with-border"></div>
                                <div className="placeholder-block placeholder-block-right with-border"></div>
                                <div className="placeholder-block placeholder-block-top with-border"></div>
                            </div>
                            <div className={"placeholder-info"}>
                                <div className="placeholder-info-heading">
                                    <div className="placeholder-block placeholder-block-left with-border"></div>
                                    <div className="placeholder-block placeholder-block-right with-border"></div>
                                    <div className="placeholder-block placeholder-block-top with-border"></div>
                                    <div className="placeholder-block placeholder-block-bottom with-border"></div>
                                </div>
                                <div className={"placeholder-info-text"}>
                                    <div className="placeholder-block placeholder-block-left with-border"></div>
                                    <div className="placeholder-block placeholder-block-right with-border"></div>
                                    <div className="placeholder-block placeholder-block-top with-border"></div>
                                    <div className="placeholder-block placeholder-block-bottom with-border"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={"leaderboard map-rankings" + (map?.isBoostless ? ' boostless' : '') + (isAdminAuthorized ? ' admin-view' : '')}>
                        {map && [...(map.entries || [])].sort((a, b) => compareEntries(a, b, map.isBoostless)).map((entry, index) => (
                            <div key={entry.discordID}
                                 className={"leaderboard-entry" + (isAdminAuthorized ? ' admin-view' : '')}
                                 style={{'--leaderboard-entry-animation-delay': 500 + 75*index + 'ms'}}>
                                <span className={"placing"}>{index + 1}</span>
                                <Link to={`/user/${entry.discordID}`}>{ entry.userName }</Link>
                                <span className="entry-time">{ msToTime(entry.time) }</span>
                                {map.isBoostless && (<span className="entry-boosts" title="Boosts used">{entry.boosts ?? 0}</span>)}
                                { isAdminAuthorized &&
                                    <button type={"button"} onClick={() => handleDeleteEntry(entry)}
                                            className={"delete-btn btn btn-ghost btn-small"}>
                                        -</button>
                                }
                            </div>
                        ))}
                    </div>
                </div>
                <div className="col-right">
                    { isAdminAuthorized &&
                        <div className="admin-panel card">
                            <h2> Admin Panel </h2>
                            <div className="admin-card-cnt">
                                <ChangeDifficultyBonusForm mapKey={getMapKey(map)} user={user} onDifficultyChanged={fetchMap} map={map} />
                                <div className="buttons-cnt">
                                    <h3>Buttons :)</h3>
                                    <div className="buttons">
                                        <button className="btn btn-red btn-small" onClick={handleDeleteMap}>
                                            !Delete Map!
                                        </button>
                                        <button className="btn btn-gray btn-small" onClick={handleLogPointsClick} title="Logs some info about what points there should be and what they really are into the console">
                                            log points
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                    <div className="submit-entry card">
                        {user.userName && (
                            <CreateEntryForm
                                mapKey={getMapKey(map)}
                                user={user}
                                onEntrySaved={fetchMap}
                                submissionMode={map?.featured === true ? 'motw' : 'normal'}
                                isBoostless={map?.isBoostless === true}
                            />
                        )}
                        {!user.userName && <h2>Login to Submit Entry</h2>}
                    </div>
                    {map?.featured && (<Link to="/map-of-the-week" className="btn btn-primary btn-small">Visit Map of the Week Leaderboard</Link>)}
                    <div className="map-details-placeholder placeholder-wrapper">
                        <div className={"map-details card placeholder-target" + (isLoading ? ' is-loading' : '')}>
                            <h2 className={"heading-description"}>
                                Description
                            </h2>
                            <p className="description">
                                { map?.description }
                            </p>
                        </div>
                        <div className={"placeholder" + (isLoading ? ' is-loading' : '')}>
                            <div className={"placeholder-heading"}>
                                <div className="placeholder-block placeholder-block-left with-border"></div>
                                <div className="placeholder-block placeholder-block-right with-border"></div>
                                <div className="placeholder-block placeholder-block-top with-border"></div>
                                <div className="placeholder-block placeholder-block-bottom with-border"></div>
                            </div>
                            <div className={"placeholder-content"}>
                                <div className={"placeholder-line placeholder-line-1"}>
                                    <div className="placeholder-block placeholder-block-left with-border-inline"></div>
                                    <div className="placeholder-block placeholder-block-right with-border-inline"></div>
                                    <div className="placeholder-block placeholder-block-bottom with-border-inline"></div>
                                </div>
                                <div className={"placeholder-line placeholder-line-2"}>
                                    <div className="placeholder-block placeholder-block-left with-border-inline"></div>
                                    <div className="placeholder-block placeholder-block-right with-border"></div>
                                    <div className="placeholder-block placeholder-block-bottom with-border"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
 
export default MapDetails;