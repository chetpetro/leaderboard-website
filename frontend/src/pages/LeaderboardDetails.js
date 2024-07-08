import { useState, useEffect } from "react";
import LeaderboardEntry from "../components/LeaderboardEntry";
import { useParams } from "react-router-dom";

const LeaderboardDetails = () => {
    const { name } = useParams()
    const [leaderboard, setLeaderboard] = useState('');

    useEffect(() => {
        const fetchLeaderboard = async () => {
            const response = await fetch('/api/leaderboards/' + name)
            const json = await response.json();

            if (response.ok) {
                setLeaderboard(json[0]);
            }
        }

        fetchLeaderboard();
    }, [])

    return (
        <div className="leaderboard-details">
            <h2>{ leaderboard.mapName && leaderboard.mapName.replace('-', ' ') }</h2>
            <p>Creator: { leaderboard.creator }</p>
            <div className="leaderboad-entries">
                {leaderboard && leaderboard.entries.sort((a, b) => a.time - b.time).map((entry, index) => (
                    <LeaderboardEntry key={entry.userName} entry={entry} pos={index + 1} />
                ))}
            </div>
        </div>
    );
}
 
export default LeaderboardDetails;