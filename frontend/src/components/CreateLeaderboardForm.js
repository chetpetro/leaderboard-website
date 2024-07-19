import { useState } from "react";

const CreateLeaderboardForm = () => {
    const [url, setURL] = useState('');
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (url === '') return;

        fetch('https://leaderboard-website-api.vercel.app/api/leaderboards/', {
            method: "POST",
            body: JSON.stringify({url}),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(() => {
            setURL('');
            window.location.reload();
        }).catch((err) => console.log(err));
    }

    return (
        <form className="create-leaderboard-form" onSubmit={handleSubmit}>
            <h2>Add Leaderboard</h2>
            <label>Steam Page URL:</label>
            <input type="text" onChange={(e) => setURL(e.target.value)} value={url}/>
            <button>Add</button>
        </form>
    );
}
 
export default CreateLeaderboardForm;