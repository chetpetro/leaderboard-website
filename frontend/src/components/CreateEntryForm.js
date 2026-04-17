import { useState } from "react";
import '../styles/components/CreateEntryForm.css';
import {useError} from "../context/ErrorContext";
const CreateEntryForm = ({ steamID, user }) => {
    const { showError } = useError();

    const [time, setTime] = useState('00:00:00.000');

    const validateInput = (splitTime) => {
        //of format: 00:00:00.000
        const msTime = Number(splitTime[3]) + Number(splitTime[2]) * 1000 + Number(splitTime[1]) * 60000 + Number(splitTime[0]) * 3600000;
        if (msTime === 0) return "Time must not be zero";
        else if (msTime < 0) return "Time must be greater than 0"; // not sure if that's possible with the regex
    }
    
    const handleSubmit = async (e) => {
        e.preventDefault();

        const splitTime = time.split(/[:.]+/)
        const errorMsg = validateInput(splitTime);
        if (errorMsg) {console.error("Error during entry submission:", errorMsg); showError(errorMsg); return;}
        const msTime = Number(splitTime[3]) + Number(splitTime[2]) * 1000 + Number(splitTime[1]) * 60000 + Number(splitTime[0]) * 3600000

        fetch('https://leaderboard-website-api.vercel.app/api/leaderboards/' + steamID, {
            method: 'PATCH',
            body: JSON.stringify({ userName: user.userName, discordID: user.discordID, time: msTime }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            }
        }).then(() => {
            setTime('00:00:00.000');
        }).catch((err) => {
            console.log(err);
            showError(err);
        });
    }

    return (
        <form className="create-entry-form" onSubmit={handleSubmit}>
            <h2>Submit Entry</h2>
            <label htmlFor="time-input">Time: (HH:mm:ss.mmm)</label>
            <div className={"input-cnt"}>
                <input id="time-input" type="text" pattern="[0-9]{2,}:[0-5]{1}[0-9]{1}:[0-5]{1}[0-9]{1}\.[0-9]{3}" onChange={(e) => setTime(e.target.value)} value={time}/>
                <button className="btn btn-primary btn-small">Add</button>
            </div>
        </form>
    );
}
 
export default CreateEntryForm;