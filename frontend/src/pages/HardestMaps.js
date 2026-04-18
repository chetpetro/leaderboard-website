import { useState, useEffect } from "react";
import '../styles/pages/HardestMaps.css'
import {Link} from "react-router-dom";

const API_BASE_URL = 'https://leaderboard-website-api.vercel.app/api';
const TOP_MAP_SPECIAL_COLOR = '#a855f7';
const MAP_DIFFICULTY_GRADIENT = ['#5b0f0f', '#ea580c', '#facc15', '#16a34a'];

const hexToRgb = (hexColor) => {
    const hex = hexColor.replace('#', '');
    return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16)
    };
};

const rgbToHex = ({ r, g, b }) => {
    const toHex = (value) => Math.round(value).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const interpolateColor = (startHex, endHex, t) => {
    const start = hexToRgb(startHex);
    const end = hexToRgb(endHex);

    return rgbToHex({
        r: start.r + (end.r - start.r) * t,
        g: start.g + (end.g - start.g) * t,
        b: start.b + (end.b - start.b) * t
    });
};

const getGradientColor = (progress) => {
    const clamped = Math.min(1, Math.max(0, progress));
    const segmentCount = MAP_DIFFICULTY_GRADIENT.length - 1;
    const scaled = clamped * segmentCount;
    const segment = Math.min(Math.floor(scaled), segmentCount - 1);
    const segmentProgress = scaled - segment;

    return interpolateColor(
        MAP_DIFFICULTY_GRADIENT[segment],
        MAP_DIFFICULTY_GRADIENT[segment + 1],
        segmentProgress
    );
};

const getDifficultyBonusRange = (maps) => {
    const bonusValues = maps
        .map((map) => Number(map.difficultyBonus))
        .filter((bonus) => Number.isFinite(bonus));

    if (bonusValues.length === 0) {
        return { min: 0, max: 0 };
    }

    return {
        min: Math.min(...bonusValues),
        max: Math.max(...bonusValues)
    };
};

const getMapRowColor = (index, difficultyBonus, minBonus, maxBonus) => {
    if (index === 0) {
        return TOP_MAP_SPECIAL_COLOR;
    }

    const numericBonus = Number(difficultyBonus);
    if (!Number.isFinite(numericBonus)) {
        return MAP_DIFFICULTY_GRADIENT[0];
    }

    if (maxBonus <= minBonus) {
        return MAP_DIFFICULTY_GRADIENT[0];
    }

    // Invertiert, damit die Reihenfolge im UI weiterhin von rot -> gruen nach unten laeuft.
    const progress = (maxBonus - numericBonus) / (maxBonus - minBonus);
    return getGradientColor(progress);
};

const HardestMaps = ({}) => {
    const [maps, setMaps] = useState([]);
    const { min: minBonus, max: maxBonus } = getDifficultyBonusRange(maps);

    useEffect(() => {
        const fetchMaps = async () => {
            const response = await fetch(`${API_BASE_URL}/leaderboards`);
            const json = await response.json();

            if (response.ok) {
                const difficultMaps = json
                    .filter((map) => map.difficultyBonus > 0)
                    .sort((a, b) => b.difficultyBonus - a.difficultyBonus)
                setMaps(difficultMaps);
            }
        }

        fetchMaps();
    }, [])

    return (
        <div className="hardest-maps">
            <div className="inside">
                <h1><span className="text-gradient">Hardest</span> Maps</h1>
                <div className={`maps-container`}>
                    <div className="maps-header">
                        <span>Map</span><span>Bonus</span><span>Clears</span>
                    </div>
                    {maps.map((map, index) => (
                        <div
                            key={map.steamID}
                            className="map-row"
                            style={{ '--row-color': getMapRowColor(index, map.difficultyBonus, minBonus, maxBonus) }}
                        >
                            <Link className="name" to={`/${map.steamID}`} title={map.mapName}>
                                {map.mapName}
                            </Link>
                            <span className="bonus">{map.difficultyBonus}</span>
                            <span className="clears">{map.entries.length}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
 
export default HardestMaps;