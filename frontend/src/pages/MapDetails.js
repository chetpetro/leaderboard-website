import { useState, useEffect, useCallback } from "react";
import {Link, useParams} from "react-router-dom";
import CreateEntryForm from "../components/CreateEntryForm";
import ChangeDifficultyBonusForm from "../components/ChangeDifficultyBonusForm";
import '../styles/pages/MapDetails.css'
import { msToTime } from "../timeUtils";
import { useError } from '../context/ErrorContext';
import useAdminAuthorization from '../hooks/useAdminAuthorization';
import useApi from '../hooks/useApi';

const MapDetails = ({user}) => {
    const api = useApi();
    const { steamID } = useParams()
    const [map, setMap] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const { showError } = useError();
    const { isAuthorized: isAdminAuthorized } = useAdminAuthorization(user);

    const fetchMap = useCallback(async () => {
        try {
            const json = await api.leaderboards.fetchBySteamID(steamID);

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
    }, [api, steamID, showError]);


    useEffect(() => {
        fetchMap();
    }, [fetchMap])

    const handleDeleteEntry = async (entry) => {
        if (!user?.token) return;
        const confirmed = window.confirm(`Are you sure you want to delete this entry?\n${entry.userName} - ${msToTime(entry.time)}`);
        if (!confirmed) return;

        try {
            await api.admin.deleteEntry(map.steamID, entry.discordID, user.token);

            setMap((prev) => {
                return {
                    ...prev,
                    entries: (prev.entries || []).filter((entryEl) => entryEl.discordID !== entry.discordID)
                };
            });
        } catch (error) {
            // Errors are already shown by the API layer.
        }
    };


    return (
        <div className="map-details">
            <div className={"inside"}>
                <div className="col-left">
                    <div className={"map-hero-placeholder placeholder-wrapper"}>
                        <div className={"map-hero placeholder-target" + (isLoading ? ' is-loading' : '')}>
                            <div className="map-image media-container">
                                <img src={map.previewImage} alt={`${map.mapName} preview`} />
                            </div>
                            <img src={map.previewImage} alt={""} className={"bg-blurred-img"}/>
                            <div className={"map-info"}>
                                <h1 className="details-map-name">{map.mapName || 'Unknown'}</h1>
                                <div className="details">
                                    <span className={"map-creator"}>By: { map.creator }</span>
                                    {map.difficultyBonus > 0 && (<div className="difficulty-bonus-cnt">
                                        <div className="hot_pepper media-container"><img src="/hot_pepper.png" alt=""/></div><span className="bonus">+{map.difficultyBonus}</span>
                                    </div>)}
                                </div>
                            </div>
                            <a className="steam-btn btn btn-small" title={`View ${map.mapName} on Steam`} href={`https://steamcommunity.com/sharedfiles/filedetails/?id=${map.steamID}`} target="_blank" rel="noopener noreferrer">
                                <div className="media-container">
                                    <img src={"/Steam.svg"} alt="Steam Icon" className="steam-icon" />
                                </div>
                            </a>
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
                    <div className="leaderboard map-rankings">
                        {map && map.entries.sort((a, b) => a.time - b.time).map((entry, index) => (
                            <div key={entry.discordID} className={"leaderboard-entry" + (isAdminAuthorized ? ' admin-view' : '')}>
                                <span className={"placing"}>{index + 1}</span>
                                <Link to={`/user/${entry.discordID}`}>{ entry.userName }</Link>
                                <span>{ msToTime(entry.time) }</span>
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
                            <ChangeDifficultyBonusForm steamID={map.steamID} user={user} onDifficultyChanged={fetchMap} map={map} />
                        </div>
                    }
                    <div className="submit-entry card">
                        {user.userName && <CreateEntryForm steamID={ map.steamID } user={user} onEntrySaved={fetchMap} />}
                        {!user.userName && <h2>Login to Submit Entry</h2>}
                    </div>
                    <div className="map-details-placeholder placeholder-wrapper">
                        <div className={"map-details card placeholder-target" + (isLoading ? ' is-loading' : '')}>
                            <h2 className={"heading-description"}>
                                Description
                            </h2>
                            <p className="description">
                                { map.description }
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