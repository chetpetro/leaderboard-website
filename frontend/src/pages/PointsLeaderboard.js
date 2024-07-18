import { useEffect, useState } from "react";
import { Link } from "react-router-dom"

const PointsLeaderboard = () => {
    const [users, setUsers] = useState('')

    useEffect(() => {
        const fetchUsers = async () => {
            const response = await fetch('/api/user/')
            const json = await response.json();

            if (response.ok) {
                setUsers(json);
            }
        }

        fetchUsers();
    }, [])

    return (
        <div>
            <h2 className="details-map-name" >Points</h2>
            <div className="leaderboard-details">
                <div className="leaderboad-entries">
                    {users && users.map((user, index) => (
                        <div className="leaderboard-entry">
                            <p style={{width: "2%"}}>{ index + 1 }</p>
                            <Link to={`/user/${user.discordID}`}><p>{ user.userName }</p></Link>
                            <p>{ user.points }</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
 
export default PointsLeaderboard;