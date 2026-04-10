import '../styles/components/PlayerPodium.css';
import {json, Link} from "react-router-dom";

const PlayerPodium = ({ players }) => {
    return (
        <div className="player-podium bg-primary">
            <div className="inside">
                <h2>Top Players</h2>
                <div className="podium">
                    {players.map((player, index) => (
                        <div className="player-cnt" key={player._id}>
                            <Link to={`/user/${player.discordID}`} className={'player ' + (index === 0 ? 'third' : index === 1 ? 'first' : 'second')}>
                                <div className="media-container medal">
                                    {index === 1 ? '🥇' : index === 0 ? '🥉' : '🥈'}
                                </div>
                                <div className="name">
                                    {player.userName}
                                </div>
                                <div className="points">
                                    {player.points} pts
                                </div>
                            </Link>
                        </div>

                    ))}
                </div>
            </div>
        </div>
    );
};
 
export default PlayerPodium;