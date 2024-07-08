const LeaderboardEntry = ({ entry, pos }) => {
    return (
        <div className="leaderboard-entry">
            <p>{ pos }</p>
            <p>{ entry.userName }</p>
            <p>{ entry.time }</p>
        </div>
    );
}
 
export default LeaderboardEntry;