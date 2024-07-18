import { Link } from "react-router-dom";

const LeadearboardPreview = ({ leaderboard, motw }) => {
    return (
        <Link to={`/${leaderboard.mapName}`} className="leaderboard-preview-link">
            <div className="leaderboard-preview" style={{background: `linear-gradient(90deg, rgba(40, 40, 40, 1) 50%, ${leaderboard.colour.rgba} 70%)`}}>
                {motw.mapName === leaderboard.mapName && <h4 style={{color: "gold"}}>{ leaderboard.mapName }</h4>}
                {motw.mapName !== leaderboard.mapName && <h4>{ leaderboard.mapName }</h4>}
                <p>Creator: { leaderboard.creator }</p>
                <p>Players: { leaderboard.entries.length }</p>
                <img src={leaderboard.previewImage}/>
            </div>
        </Link>
    );
}
 
export default LeadearboardPreview;