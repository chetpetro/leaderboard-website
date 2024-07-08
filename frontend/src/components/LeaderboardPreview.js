import { Link } from "react-router-dom";

const LeadearboardPreview = ({ leaderboard }) => {
    return (    
        <div className="leaderboard-preview">
            <Link to={`/${leaderboard.mapName}`}>
                <h2 className="leaderboard-name">{ leaderboard.mapName.replace('-', ' ') }</h2>
            </Link>
            <p>Creator: { leaderboard.creator }</p>
            <p>Players: { leaderboard.entries.length }</p>
        </div>
    );
}
 
export default LeadearboardPreview;