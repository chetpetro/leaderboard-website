import '../styles/components/PlayerPodium.css';
import {Link} from "react-router-dom";
import CountUp from "./CountUp";
import {useEffect, useState} from "react";

const PlayerPodium = ({ players }) => {
    const [shownPlayers, setShownPlayers] = useState([]);
    useEffect(() => {
        if (players.length !== 0) setShownPlayers(players)
        else setShownPlayers([
            {discordID: 0, userName: "_", value: ""},
            {discordID: 1, userName: "_", value: ""},
            {discordID: 2, userName: "_", value: ""}
        ])
    }, [players]);
    return (
        <div className="player-podium bg-primary">
            <div className="inside">
                <h2>Top Players</h2>
                <div className="podium">
                    {shownPlayers.map((player, index) => (
                        <div className={`player-cnt ${players.length === 0 ? 'dummy-user' : ''}`}
                             key={index}>
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