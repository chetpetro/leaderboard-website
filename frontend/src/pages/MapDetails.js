import { useState, useEffect, useCallback } from "react";
import {Link, useParams} from "react-router-dom";
import CreateEntryForm from "../components/CreateEntryForm";
import '../styles/MapDetails.css'
import { msToTime } from "../timeUtils";
import { useError } from '../context/ErrorContext';

const MapDetails = ({user}) => {
    const { steamID } = useParams()
    const [map, setMap] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const { showError } = useError();

    const fetchMap = useCallback(async () => {
        try {
            const response = await fetch('https://leaderboard-website-api.vercel.app/api/leaderboards/' + steamID)
            const json = await response.json();

            if (!response.ok) {
                showError('Failed to load map details');
                setIsLoading(false);
                return;
            }

            setMap(json[0]);
            setIsLoading(false);
        } catch (error) {
            showError(error.message || 'Failed to load map details. Please try again.');
            setIsLoading(false);
        }
    }, [steamID, showError]);


    useEffect(() => {
        setIsLoading(true);
        fetchMap();
    }, [fetchMap])

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
                                <span className={"map-creator"}>By: { map.creator }</span>
                            </div>
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