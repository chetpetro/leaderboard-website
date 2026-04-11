import { useEffect, useState } from "react";
import PlayerPodium from "../components/PlayerPodium";
import '../styles/pointsLeaderboard/PointsLeaderboard.css';
import {Link} from "react-router-dom";

const PointsLeaderboard = () => {
    const [users, setUsers] = useState('')

    useEffect(() => {
        const fetchUsers = async () => {
            const response = await fetch('https://leaderboard-website-api.vercel.app/api/user/')
            const json = await response.json();

            if (response.ok) {
                setUsers(json);
            }
        }

        fetchUsers();
    }, [])

    return (
        <div className="points-leaderboard">
            {users.length >= 3 && <PlayerPodium players={users.slice(0, 3)} />}
            <div className="leaderboard">
                <div className="inside">
                    {users.length > 3 && users.slice(3).filter(user => user.points > 0).map((user, index) => (
                        <Link to={`/user/${user.discordID}`} className="leaderboard-entry" key={user._id}>
                            <div className="rank">{index + 4}</div>
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