import { Link } from 'react-router-dom';

const LeaderboardEntry = ({ entry, pos }) => {
    const msToTime = (duration) => {
        var milliseconds = duration.toString().slice(-3);
        var seconds = Math.floor((duration / 1000) % 60);
        var minutes = Math.floor((duration / (1000 * 60)) % 60);
        var hours = Math.floor(duration / (1000 * 60 * 60));

        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;
        hours = (hours < 10) ? "0" + hours : hours;

        return hours + ':' + minutes + ':' + seconds + '.' + milliseconds;
    }

    return (
        <div className="leaderboard-entry">
            <p style={{width: "2%"}}>{ pos }</p>
            <p>{ msToTime(entry.time) }</p>
            <Link to={`/user/${entry.discordID}`}><p>{ entry.userName }</p></Link>
        </div>
    );
}
 
export default LeaderboardEntry;