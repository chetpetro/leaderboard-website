import { Link } from "react-router-dom";

const LeadearboardPreview = ({ leaderboard, motw }) => {
    return (
        <Link to={`/${leaderboard.mapName}`} className="leaderboard-preview-link">
            <div className="leaderboard-preview" style={{background: `linear-gradient(0deg, rgba(40, 40, 40, 1) 40%, ${leaderboard.colour.rgba} 70%)`}}>
                <img src={leaderboard.previewImage}/>
                {motw.mapName === leaderboard.mapName && <h4 style={{color: "gold"}}>{ leaderboard.mapName }</h4>}
                {motw.mapName !== leaderboard.mapName && <h4>{ leaderboard.mapName }</h4>}
                <p>Creator: { leaderboard.creator }</p>
                <p>Players: { leaderboard.entries.length }</p>
            </div>
        </Link>
    );
}
 
export default LeadearboardPreview;