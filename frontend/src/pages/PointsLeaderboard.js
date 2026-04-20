import { useEffect, useState } from "react";
import PlayerPodium from "../components/PlayerPodium";
import '../styles/pages/PointsLeaderboard.css';
import {Link} from "react-router-dom";
import useApi from "../hooks/useApi";

const PointsLeaderboard = () => {
    const api = useApi();
    const [users, setUsers] = useState('')

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

            {users.length >= 3 && <PlayerPodium players={users.slice(0,3).map(player => ({
                _id: player._id,
                userName: player.userName,
                discordID: player.discordID,
                value: player.points + " pts"
            }))}/>}
            <div className="leaderboard">
                <div className="inside">
                    {users.length > 3 && users.slice(3).filter(user => user.points > 0).map((user, index) => (
                        <Link to={`/user/${user.discordID}`} className="leaderboard-entry" key={user._id}>
                            <div className="placing">{index + 4}</div>
                            <div className="name">{user.userName}</div>
                            <div className="points">{user.points} pts</div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
 
export default PointsLeaderboard;