import { useEffect, useState } from "react";
import LeaderboardEntry from "../components/LeaderboardEntry";

const PointsLeaderboard = () => {
    const [users, setUsers] = useState('')

    useEffect(() => {
        const fetchLeaderboard = async () => {
            const response = await fetch('/api/user/')
            const json = await response.json();

            if (response.ok) {
                set(json);
            }
        }

        fetchLeaderboard();
    }, [])

    return (
        <div>
            <h2 className="details-map-name" >Points</h2>
            <div className="leaderboard-details">
                <div className="leaderboad-entries">
                    {leaderboard && leaderboard.entries.sort((a, b) => a.time - b.time).map((entry, index) => (
                        <LeaderboardEntry key={entry.userName} entry={entry} pos={index + 1} />
                    ))}
                </div>
                {user.userName && <CreateEntryForm mapName={ leaderboard.mapName } entries={ leaderboard.entries } user={user}/>}
                {!user.userName && <h2>Login to Submit Entry</h2>}
            </div>
        </div>
    );
}
 
export default PointsLeaderboard;