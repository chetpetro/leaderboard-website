import { useEffect, useState } from "react";
import PlayerPodium from "../components/PlayerPodium";
import '../styles/pages/PointsLeaderboard.css';
import {Link} from "react-router-dom";
import useApi from "../hooks/useApi";
import CountUp from "../components/CountUp";

const PointsLeaderboard = () => {
    const api = useApi();
    const [users, setUsers] = useState([])

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const json = await api.user.fetchAll();
                setUsers(json);
            } catch (error) {
                // Errors are already shown by the API layer.
            }
        }

        fetchUsers();
    }, [api])

    return (
        <div className="points-leaderboard">
            {<PlayerPodium players={users.slice(0,3).map(player => ({
                _id: player._id,
                userName: player.userName,
                discordID: player.discordID,
                value: player.totalMapPoints + " pts"
            }))}/>}
            <div className="leaderboard">
                <div className="inside">
                    {users.length > 3 && users.slice(3).filter(user => user.totalMapPoints > 0).map((user, index) => (
                        <Link key={user._id} to={`/user/${user.discordID}`}
                              className="leaderboard-entry"
                              style={{'--leaderboard-entry-animation-delay': 500 + 75*index + 'ms'}}>
                            <div className="placing">{index + 4}</div>
                            <div className="name">{user.userName}</div>
                            <div className="points">
                                <CountUp
                                    to={parseInt(user.totalMapPoints)}
                                    speed={3}
                                    acceleration={1.25}
                                /> pts</div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
 
export default PointsLeaderboard;