import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { msToTime } from "../timeUtils";
import '../styles/pages/UserDetails.css'
import useApi from "../hooks/useApi";
import CountUp from "../components/CountUp";

const MAP_POINTS_GRADIENT = ['#9c27b0', '#cc8dd4', '#e1bbe6'];

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
    const segmentCount = MAP_POINTS_GRADIENT.length - 1;
    const scaled = clamped * segmentCount;
    const segment = Math.min(Math.floor(scaled), segmentCount - 1);
    const segmentProgress = scaled - segment;

    return interpolateColor(
        MAP_POINTS_GRADIENT[segment],
        MAP_POINTS_GRADIENT[segment + 1],
        segmentProgress
    );
};

const getMapPointsColor = (points, minPoints, maxPoints) => {
    const numericPoints = Number(points);
    if (!Number.isFinite(numericPoints)) {
        return MAP_POINTS_GRADIENT[0];
    }

    if (maxPoints <= minPoints) {
        return MAP_POINTS_GRADIENT[1];
    }

    const progress = (numericPoints - minPoints) / (maxPoints - minPoints);
    return getGradientColor(progress);
};

const UserDetails = () => {
    const api = useApi();
    const { discordID } = useParams()
    const [entries, setEntries] = useState([]);
    const [user, setUser] = useState({});
    const [motwInfo, setMotwInfo] = useState(null);

    const numericMapPoints = (user.mapPoints ?? [])
        .map((entry) => Number(entry.points))
        .filter((points) => Number.isFinite(points));
    const minMapPoints = numericMapPoints.length ? Math.min(...numericMapPoints) : 0;
    const maxMapPoints = numericMapPoints.length ? Math.max(...numericMapPoints) : 0;
    const totalMapPoints = numericMapPoints.reduce((sum, points) => sum + points, 0);
    const getMapPointsForSteamId = (steamID) => {
        const mapPointsEntry = user.mapPoints?.find((entry) => entry.mapSteamID === steamID);
        const mapPoints = Number(mapPointsEntry?.points);
        return Number.isFinite(mapPoints) ? mapPoints : 0;
    };

    const motwStreak = useMemo(() => {
        if(!motwInfo) return
        const motwNumber = motwInfo.motwNumber;
        console.log("motwInfo", motwInfo);
        if (!Number.isFinite(motwNumber) || motwNumber <= 0) {
            return 0;
        }

        const participationNumbers = new Set(
            (user.mapOfTheWeekParticipations ?? [])
                .map((entry) => Number(entry.motwNumber))
                .filter((number) => Number.isFinite(number))
        );

        console.log("participationNumbers", participationNumbers);

        const startMotwNumber = motwNumber - 1;

        console.log("startMotwNumber", startMotwNumber);

        let streak = 0;
        console.log("Initial streak", streak);

        while (participationNumbers.has(startMotwNumber - streak)) {
            streak += 1;
        }
        if (motwInfo.submittedToCurrent) streak += 1;
        return streak;
    }, [motwInfo, user.mapOfTheWeekParticipations]);

    const sortedEntries = [...entries].sort((entryA, entryB) => {
        const pointsDiff = getMapPointsForSteamId(entryB.steamID) - getMapPointsForSteamId(entryA.steamID);
        if (pointsDiff !== 0) {
            return pointsDiff;
        }

        if (entryA.pos !== entryB.pos) {
            return entryA.pos - entryB.pos;
        }

        return String(entryA.steamID).localeCompare(String(entryB.steamID));
    });

    useEffect(() => {
        const loadUserAndMapSubmission = async () => {
            try {
                const motwPayload = await api.leaderboards.fetchMOTW();
                if (motwPayload) {
                    console.log("payload", motwPayload)
                    setMotwInfo({
                        motwNumber: Number(motwPayload.motwNumber),
                        submittedToCurrent: motwPayload.entries?.some((entry) => entry.discordID === discordID) || false
                    });
                }
            } catch (error) {
                // Errors are already shown by the API layer.
            }

            try {
                const userPayload = await api.user.fetchById(discordID);
                if (!userPayload?.user) return;

                setUser(userPayload.user);

                const entriesPayload = await api.leaderboards.fetchEntriesByUser(discordID);
                if (entriesPayload?.entries) {
                    setEntries(entriesPayload.entries);
                }

                if (userPayload.shouldUpdatePoints) {
                    const updatedPayload = await api.user.updatePoints(discordID);
                    if (updatedPayload?.user) setUser(updatedPayload.user);
                    if (updatedPayload?.entries) setEntries(updatedPayload.entries);
                }
            } catch (error) {
                // Errors are already shown by the API layer.
            }
        };

        loadUserAndMapSubmission();
    }, [api, discordID])
    return (
        <div className="user">
            <div className="hero">
                <div className="inside">
                    <div className="points-center-display">
                        <h1 className="details-map-name text-gradient">{ user.userName }</h1>
                        <span className="user-points">
                            <CountUp
                                to={parseInt(totalMapPoints)}
                                speed={2}
                                acceleration={1.1}
                            />
                            <small>PTS</small></span>
                    </div>
                    <div className="motw-info">
                        <h2>
                            Map of the Week
                        </h2>
                        <div className="motw-info-content">
                            <div className="motw-streak">
                                <h3>streak</h3>
                                <div>
                                    {motwStreak}
                                    {motwStreak >= 3 && <span className="flame">🔥</span>}
                                </div>
                            </div>
                            <div className="motw-wins">
                                <h3>wins</h3>
                                {user.mapOfTheWeekParticipations && <div>{user.mapOfTheWeekParticipations.filter((entry) => entry.placement === 0).length}</div>}
                                {!user.mapOfTheWeekParticipations && <div>0</div>}
                            </div>
                            <div className="motw-participations">
                                <h3>participations</h3>
                                {user.mapOfTheWeekParticipations && motwInfo && <div>{user.mapOfTheWeekParticipations.length + (motwInfo.submittedToCurrent ? 1 : 0)}</div>}
                                {!user.mapOfTheWeekParticipations || !motwInfo && <div>0</div>}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            <div className="leaderboad-entries">
                <div className="inside leaderboard">
                    {sortedEntries.map((map, index) => {
                        const mapPoints = getMapPointsForSteamId(map.steamID);

                        return (
                            <div className="leaderboard-entry-wrapper" key={map.steamID}>
                                <div className="leaderboard-entry" style={{'--leaderboard-entry-animation-delay': 500 + 75*index + 'ms'}}>
                                    <span className={"map-placing map-pos-" + map.pos}>
                                        { map.pos }
                                    </span>
                                    <Link to={`/${map.steamID}`} className="map-link">{ map.mapName }</Link>
                                    <span className="time">{ msToTime(map.entry.time) }</span>
                                </div>
                                <span className="map-points" style={{ color: getMapPointsColor(mapPoints, minMapPoints, maxMapPoints), '--leaderboard-entry-animation-delay': 500 + 75*index + 'ms' }}>
                                    +{parseInt(mapPoints)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default UserDetails;