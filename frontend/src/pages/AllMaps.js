import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import '../styles/pages/AllMaps.css'
import useApi from "../hooks/useApi";
import { ToggleButton } from "../components/ToggleButton";
import { getMapPath, getMapKey } from "../utils/mapUtils";

const PAGE_SIZE = 9;

const AllMaps = () => {
    const api = useApi();
    const [maps, setMaps] = useState([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [sortMostPlayed, setSortMostPlayed] = useState(true);
    const [onlyWithBonus, setOnlyWithBonus] = useState(false);
    const [onlyBoostless, setOnlyBoostless] = useState(false);

    const fetchPage = useCallback(async (offset) => {
        setIsLoading(true);
        try {
            const json = await api.leaderboards.browse({
                sort: sortMostPlayed ? 'mostPlayed' : 'leastPlayed',
                bonusOnly: onlyWithBonus,
                boostless: onlyBoostless,
                limit: PAGE_SIZE,
                offset
            });
            setTotal(json?.total || 0);
            const pageMaps = json?.maps || [];
            setMaps((prev) => offset === 0 ? pageMaps : [...prev, ...pageMaps]);
        } catch (error) {
            // Errors are already shown by the API layer.
        } finally {
            setIsLoading(false);
        }
    }, [api, sortMostPlayed, onlyWithBonus, onlyBoostless]);

    // Re-fetch from the first page whenever sort or filters change.
    useEffect(() => {
        fetchPage(0);
    }, [fetchPage]);

    return (
        <div className="all-maps">
            <div className="inside">
                <h1 className="heading"><span className="text-gradient">All</span> Maps</h1>
                <div className="filters">
                    <ToggleButton
                        isOn={sortMostPlayed}
                        onToggle={() => setSortMostPlayed(!sortMostPlayed)}
                        label="Sort"
                        onLabel="Most Played"
                        offLabel="Least Played"
                    />
                    <ToggleButton
                        isOn={onlyWithBonus}
                        onToggle={() => setOnlyWithBonus(!onlyWithBonus)}
                        label="Difficulty Bonus"
                        onLabel="Only With Bonus"
                        offLabel="All Maps"
                    />
                    <ToggleButton
                        isOn={onlyBoostless}
                        onToggle={() => setOnlyBoostless(!onlyBoostless)}
                        label="Boostless"
                        onLabel="Only Boostless"
                        offLabel="All Maps"
                    />
                </div>
                <p className="map-count text-muted">
                    Showing {maps.length} of {total} maps
                </p>
                {maps.length > 0 ? (
                    <div className="maps">
                        {maps.map((map) => (
                            <Link to={getMapPath(map)} className="map" key={map._id || getMapKey(map)}>
                                <div className="map-blurred-bg media-container">
                                    <img src={map.previewImage} alt="" />
                                </div>
                                <div className="map-img-cnt media-container">
                                    <img src={map.previewImage} alt={`${map.mapName} preview`} />
                                </div>
                                <div className="map-info">
                                    <h3>{map.mapName}</h3>
                                    {Number(map.difficultyBonus) > 0 && (
                                        <div className="difficulty-bonus-cnt">
                                            <div className="hot_pepper media-container"><img src="/hot_pepper.png" alt=""/></div>
                                            <span className="bonus">+{map.difficultyBonus}</span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    !isLoading && <p className="no-maps">No maps match these filters.</p>
                )}
                {maps.length < total && (
                    <div className="btn-container justify-center">
                        <button className="btn btn-gray" onClick={() => fetchPage(maps.length)} disabled={isLoading}>
                            {isLoading ? 'Loading...' : 'Load More'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AllMaps;
