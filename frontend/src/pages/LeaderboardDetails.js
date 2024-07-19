import { useState, useEffect } from "react";
import LeaderboardEntry from "../components/LeaderboardEntry";
import { useParams } from "react-router-dom";
import CreateEntryForm from "../components/CreateEntryForm";

const LeaderboardDetails = ({user, motw}) => {
    const { name } = useParams()
    const [leaderboard, setLeaderboard] = useState('');

    useEffect(() => {
        const fetchLeaderboard = async () => {
            const response = await fetch('https://leaderboard-website-api.vercel.app/api/leaderboards/' + name)
            const json = await response.json();

            if (response.ok) {
                setLeaderboard(json[0]);
            }
        }

        fetchLeaderboard();
    }, [])

    return (
        <div>
            {motw.mapName === leaderboard.mapName && <h2 className="details-map-name" style={{color:"gold"}}>{ leaderboard.mapName && leaderboard.mapName }</h2>}
            {motw.mapName !== leaderboard.mapName && <h2 className="details-map-name">{ leaderboard.mapName && leaderboard.mapName }</h2>}
            <p>Creator: { leaderboard.creator }</p>
            <p>{ leaderboard.description }</p>
            {motw.mapName === leaderboard.mapName && <p>Map of the Week</p>}
            <div className="leaderboard-details">
                <table className="leaderboad-entries">
                    {leaderboard && leaderboard.entries.sort((a, b) => a.time - b.time).map((entry, index) => (
                        <LeaderboardEntry key={entry.userName} entry={entry} pos={index + 1} />
                    ))}
                </table>
                {user.userName && <CreateEntryForm mapName={ leaderboard.mapName } entries={ leaderboard.entries } user={user}/>}
                {!user.userName && <h2>Login to Submit Entry</h2>}
            </div>
        </div>
    );
}
 
export default LeaderboardDetails;