import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import CreateEntryForm from "../components/CreateEntryForm";
import "../styles/pages/MapDetails.css";
import { msToTime } from "../timeUtils";
import { useError } from "../context/ErrorContext";
import useApi from "../hooks/useApi";

const MapOfTheWeek = ({ user }) => {
    const api = useApi();
    const [map, setMap] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const { showError } = useError();

    const fetchMap = useCallback(async () => {
        try {
            const json = await api.leaderboards.fetchMOTW();

            if (!json || !json.steamID) {
                showError("Failed to load map of the week");
                setIsLoading(false);
                return;
            }

            const { motwNumber: currentMotwNumber, ...motwData } = json || {};
            setMap({
                ...motwData,
                motwNumber: currentMotwNumber
            });
            setIsLoading(false);
        } catch (error) {
            // Errors are already shown by the API layer.
            setIsLoading(false);
        }
    }, [api, showError]);

    useEffect(() => {
        fetchMap();
    }, [fetchMap]);


    const motwEntries = useMemo(() => {
        const entries = Array.isArray(map?.entries) ? map.entries : [];

        return [...entries].sort((a, b) => a.time - b.time);
    }, [map]);

    return (
        <div className="map-details">
            <div className="inside">
                <div className="col-left">
                    <div className="map-hero-placeholder placeholder-wrapper">
                        <div className={"map-hero placeholder-target" + (isLoading ? " is-loading" : "")}>
                            <div className="map-image media-container">
                                <img src={map.previewImage} alt={`${map.mapName} preview`} />
                            </div>
                            <img src={map.previewImage} alt="" className="bg-blurred-img" />
                            <div className="map-info">
                                <h1 className="details-map-name">{map.mapName || "Unknown"}</h1>
                                <div className="details">
                                    <span className="map-creator">By: {map.creator}</span>
                                    {map.difficultyBonus > 0 && (
                                        <div className="difficulty-bonus-cnt">
                                            <div className="hot_pepper media-container"><img src="/hot_pepper.png" alt="" /></div><span className="bonus">+{map.difficultyBonus}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <a
                                className="steam-btn btn btn-small"
                                title={`View ${map.mapName} on Steam`}
                                href={`https://steamcommunity.com/sharedfiles/filedetails/?id=${map.steamID}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <div className="media-container">
                                    <img src="/Steam.svg" alt="Steam Icon" className="steam-icon" />
                                </div>
                            </a>
                        </div>
                        <div className={"placeholder" + (isLoading ? " is-loading" : "")}>
                            <div className="placeholder-image">
                                <div className="placeholder-block placeholder-block-left with-border"></div>
                                <div className="placeholder-block placeholder-block-right with-border"></div>
                                <div className="placeholder-block placeholder-block-top with-border"></div>
                            </div>
                            <div className="placeholder-info">
                                <div className="placeholder-info-heading">
                                    <div className="placeholder-block placeholder-block-left with-border"></div>
                                    <div className="placeholder-block placeholder-block-right with-border"></div>
                                    <div className="placeholder-block placeholder-block-top with-border"></div>
                                    <div className="placeholder-block placeholder-block-bottom with-border"></div>
                                </div>
                                <div className="placeholder-info-text">
                                    <div className="placeholder-block placeholder-block-left with-border"></div>
                                    <div className="placeholder-block placeholder-block-right with-border"></div>
                                    <div className="placeholder-block placeholder-block-top with-border"></div>
                                    <div className="placeholder-block placeholder-block-bottom with-border"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="leaderboard map-rankings">
                        {motwEntries.map((entry, index) => (
                            <div key={entry.discordID} className={"leaderboard-entry"}>
                                <span className="placing">{index + 1}</span>
                                <Link to={`/user/${entry.discordID}`}>{entry.userName}</Link>
                                <span>{msToTime(entry.time)}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="col-right">
                    <div className="submit-entry card">
                        {user.userName && (
                            <CreateEntryForm
                                steamID={map.steamID}
                                user={user}
                                onEntrySaved={fetchMap}
                                submissionMode="motw"
                                syncNormalEntry
                            />
                        )}
                        {!user.userName && <h2>Login to Submit Entry</h2>}
                    </div>
                    <div className="map-details-placeholder placeholder-wrapper">
                        <div className={"map-details card placeholder-target" + (isLoading ? " is-loading" : "")}>
                            <h2 className="heading-description">Description</h2>
                            <p className="description">{map.description}</p>
                        </div>
                        <div className={"placeholder" + (isLoading ? " is-loading" : "")}>
                            <div className="placeholder-heading">
                                <div className="placeholder-block placeholder-block-left with-border"></div>
                                <div className="placeholder-block placeholder-block-right with-border"></div>
                                <div className="placeholder-block placeholder-block-top with-border"></div>
                                <div className="placeholder-block placeholder-block-bottom with-border"></div>
                            </div>
                            <div className="placeholder-content">
                                <div className="placeholder-line placeholder-line-1">
                                    <div className="placeholder-block placeholder-block-left with-border-inline"></div>
                                    <div className="placeholder-block placeholder-block-right with-border-inline"></div>
                                    <div className="placeholder-block placeholder-block-bottom with-border-inline"></div>
                                </div>
                                <div className="placeholder-line placeholder-line-2">
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
};

export default MapOfTheWeek;

