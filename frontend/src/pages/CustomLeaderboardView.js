import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useApi from '../hooks/useApi';

const CustomLeaderboardView = () => {
    const api = useApi();
    const { id } = useParams();
    const [leaderboard, setLeaderboard] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const fetchLeaderboard = async () => {
            try {
                const json = await api.leaderboards.fetchCustomLeaderboard(id);
                if (isMounted) {
                    setLeaderboard(json);
                }
            } catch (error) {
                // Errors are already shown by the API layer.
            }
        };

        fetchLeaderboard();

        return () => {
            isMounted = false;
        };
    }, [api, id]);

    return (
        <div className="inside">
            <h1>Custom Leaderboard</h1>
            <pre>{JSON.stringify(leaderboard, null, 2)}</pre>
        </div>
    );
};

export default CustomLeaderboardView;
