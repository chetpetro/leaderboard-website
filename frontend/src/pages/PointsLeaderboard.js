import { useEffect, useState } from "react";
import { Link } from "react-router-dom"

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
        <div>
            <h2 className="details-map-name" >Points</h2>
            <div className="leaderboard-details">
                <table className="leaderboad-entries">
                    {users && users.map((user, index) => (
                        <tr className="leaderboard-entry">
                            <td >{ index + 1 }</td>
                            <Link to={`/user/${user.discordID}`}><td>{ user.userName }</td></Link>
                            <td>{ user.points }</td>
                        </tr>
                    ))}
                </table>
            </div>
        </div>
    );
}
 
export default PointsLeaderboard;