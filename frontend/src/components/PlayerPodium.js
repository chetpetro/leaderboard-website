import '../styles/components/PlayerPodium.css';
import {Link} from "react-router-dom";
import CountUp from "./CountUp";

const PlayerPodium = ({ players }) => {
    return (
        <div className="player-podium bg-primary">
            <div className="inside">
                <h2>Top Players</h2>
                <div className="podium">
                    {players.map((player, index) => (
                        <div className="player-cnt" key={player.discordID}>
                            <Link to={`/user/${player.discordID}`} className={'player ' + (index === 0 ? 'first' : index === 1 ? 'second' : 'third')}>
                                <div className="media-container medal">
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                </div>
                                <div className="name">
                                    {player.userName}
                                </div>
                                <div className="points">
                                    <CountUp
                                        to={parseInt(player.value)}
                                        speed={4}
                                        acceleration={1.05}
                                    />
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