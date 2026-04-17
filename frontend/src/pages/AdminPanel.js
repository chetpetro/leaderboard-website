import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useError } from '../context/ErrorContext';
import { msToTime } from '../timeUtils';

const API_BASE_URL = 'https://leaderboard-website-api.vercel.app/api';

const AdminPanel = ({ user }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isMapsLoading, setIsMapsLoading] = useState(false);
    const [leaderboards, setLeaderboards] = useState([]);
    const [selectedSteamID, setSelectedSteamID] = useState('');
    const [isDeletingDiscordID, setIsDeletingDiscordID] = useState('');
    const { showError } = useError();

    useEffect(() => {
        const checkAdminAccess = async () => {
            if (!user?.token) {
                setIsAuthorized(false);
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/admin/status`, {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                });

                setIsAuthorized(response.ok);
            } catch (error) {
                showError(error.message || 'Could not verify admin access.');
                setIsAuthorized(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAdminAccess();
    }, [showError, user?.token]);

    useEffect(() => {
        const fetchLeaderboards = async () => {
            if (!isAuthorized) return;

            setIsMapsLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/leaderboards`);
                const json = await response.json();

                if (!response.ok) {
                    showError(json?.error || 'Failed to load leaderboards.');
                    return;
                }

                setLeaderboards(Array.isArray(json) ? json : []);
                if (Array.isArray(json) && json.length > 0) {
                    setSelectedSteamID((prev) => prev || json[0].steamID);
                }
            } catch (error) {
                showError(error.message || 'Failed to load leaderboards.');
            } finally {
                setIsMapsLoading(false);
            }
        };

        fetchLeaderboards();
    }, [isAuthorized, showError]);

    const selectedMap = useMemo(
        () => leaderboards.find((leaderboard) => leaderboard.steamID === selectedSteamID) || null,
        [leaderboards, selectedSteamID]
    );

    const sortedEntries = useMemo(() => {
        if (!selectedMap?.entries) return [];
        return [...selectedMap.entries].sort((a, b) => a.time - b.time);
    }, [selectedMap]);

    const handleDeleteEntry = async (discordID) => {
        if (!selectedSteamID || !discordID || !user?.token) return;

        setIsDeletingDiscordID(discordID);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/leaderboards/${selectedSteamID}/entries/${discordID}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            });

            const json = await response.json().catch(() => ({}));
            if (!response.ok) {
                showError(json?.error || 'Failed to delete entry.');
                return;
            }

            setLeaderboards((prev) => prev.map((leaderboard) => {
                if (leaderboard.steamID !== selectedSteamID) return leaderboard;
                return {
                    ...leaderboard,
                    entries: (leaderboard.entries || []).filter((entry) => entry.discordID !== discordID)
                };
            }));
        } catch (error) {
            showError(error.message || 'Failed to delete entry.');
        } finally {
            setIsDeletingDiscordID('');
        }
    };

    if (!user?.token || !user?.isAdmin) return <Navigate to="/" replace />;
    if (isLoading) return <h2>Checking admin access...</h2>;
    if (!isAuthorized) return <Navigate to="/" replace />;

    return (
        <div className="admin-panel">
            <div className="card">
                <h1>Admin Panel</h1>
                <p>Manage leaderboard entries.</p>

                <div>
                    <label htmlFor="admin-map-select">Select map</label>
                    <select
                        id="admin-map-select"
                        value={selectedSteamID}
                        onChange={(event) => setSelectedSteamID(event.target.value)}
                        disabled={isMapsLoading || leaderboards.length === 0}
                    >
                        {leaderboards.map((leaderboard) => (
                            <option key={leaderboard.steamID} value={leaderboard.steamID}>
                                {leaderboard.mapName}
                            </option>
                        ))}
                    </select>
                </div>

                {isMapsLoading && <p>Loading maps...</p>}
                {!isMapsLoading && !selectedMap && <p>No maps found.</p>}

                {!isMapsLoading && selectedMap && (
                    <div className="leaderboard map-rankings">
                        {sortedEntries.length === 0 && <p>No entries for this map.</p>}

                        {sortedEntries.map((entry, index) => (
                            <div className="leaderboard-entry" key={`${entry.discordID}-${entry.time}`}>
                                <span className="placing">{index + 1}</span>
                                <Link to={`/user/${entry.discordID}`}>{entry.userName}</Link>
                                <span>{msToTime(entry.time)}</span>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteEntry(entry.discordID)}
                                    disabled={isDeletingDiscordID === entry.discordID}
                                    aria-label={`Delete ${entry.userName} time`}
                                >
                                    -
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;

