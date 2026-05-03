import { useState } from "react";
import '../styles/components/CreateEntryForm.css';
import {useError} from "../context/ErrorContext";
import useApi from "../hooks/useApi";
const CreateEntryForm = ({ steamID, user, onEntrySaved, submissionMode = 'normal' }) => {
    const { showError } = useError();
    const api = useApi();

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

        try {
            const submissionPayload = {
                userName: user.userName,
                discordID: user.discordID,
                time: msTime,
                syncNormalEntry: submissionMode === 'motw'
            };

            if (submissionMode === 'motw') {
                await api.leaderboards.createMotwEntry(
                    steamID,
                    submissionPayload,
                    user.token
                );
            } else {
                const res = await api.leaderboards.createOrEditEntry(
                    steamID,
                    submissionPayload,
                    user.token
                );
                console.log("createOrEdit\n", res)
            }

            setTime('00:00:00.000');
            onEntrySaved?.();
        } catch (err) {
            // Errors are already shown by the API layer.
        }
    }

    return (
        <form className="create-entry-form" onSubmit={handleSubmit}>
            <h2>{submissionMode === 'motw' ? 'Submit MOTW Entry' : 'Submit Entry'}</h2>
            <label htmlFor="time-input">Time: (HH:mm:ss.mmm)</label>
            <div className={"input-cnt"}>
                <input id="time-input" type="text" pattern="[0-9]{2,}:[0-5]{1}[0-9]{1}:[0-5]{1}[0-9]{1}\.[0-9]{3}" onChange={(e) => setTime(e.target.value)} value={time}/>
                <button className="btn btn-primary btn-small">Add</button>
            </div>
        </form>
    );
}
 
export default CreateEntryForm;