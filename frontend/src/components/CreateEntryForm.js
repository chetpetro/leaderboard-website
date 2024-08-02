import { useState } from "react";

const CreateEntryForm = ({ steamID, user }) => {
    const [time, setTime] = useState('00:00:00.000');
    
    const handleSubmit = async (e) => {
        e.preventDefault();

        const splitTime = time.split(/[:\.]+/)
        const msTime = Number(splitTime[3]) + Number(splitTime[2]) * 1000 + Number(splitTime[1]) * 60000 + Number(splitTime[0]) * 3600000
        
        fetch('https://leaderboard-website-api.vercel.app/api/leaderboards/' + steamID, {
            method: 'PATCH',
            body: JSON.stringify({ userName: user.userName, discordID: user.discordID, time: msTime }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            }
        }).then(() => {
            setTime('')
            //window.location.reload();
        }).catch((err) => console.log(err));
    }

    return (
        <form className="create-entry-form" onSubmit={handleSubmit}>
            <h2>Submit Entry</h2>
            <label>Time: (HH:mm:ss.mmm)</label>
            <input type="text" pattern="[0-9]{2}:[0-5]{1}[0-9]{1}:[0-5]{1}[0-9]{1}\.[0-9]{3}" onChange={(e) => setTime(e.target.value)} value={time}/>
            <button>Add</button>
        </form>
    );
}
 
export default CreateEntryForm;