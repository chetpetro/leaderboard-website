import '../styles/components/PlayerPodium.css';
import {json, Link} from "react-router-dom";

const PlayerPodium = ({ players }) => {
    const playersPodiumSorted = [];
    if (players.length === 3) {
        playersPodiumSorted[0] = players[2];
        playersPodiumSorted[1] = players[0];
        playersPodiumSorted[2] = players[1];
    }
    return (
        <div className="player-podium">
            <div className="inside">
                <h2>Current Top 3</h2>
                <div className="podium">
                    {playersPodiumSorted.map((player, index) => (
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