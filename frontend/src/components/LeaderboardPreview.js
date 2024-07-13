import { Link } from "react-router-dom";

const LeadearboardPreview = ({ leaderboard, motw }) => {
    return (
        <Link to={`/${leaderboard.mapName}`} className="leaderboard-preview-link">
            <div className="leaderboard-preview">
                {motw.mapName === leaderboard.mapName && <h4 style={{color: "gold"}}>{ leaderboard.mapName }</h4>}
                {motw.mapName !== leaderboard.mapName && <h4>{ leaderboard.mapName }</h4>}
                <p>Creator: { leaderboard.creator }</p>
                <p>Players: { leaderboard.entries.length }</p>
            </div>
        </Link>
    );
}
 
export default LeadearboardPreview;