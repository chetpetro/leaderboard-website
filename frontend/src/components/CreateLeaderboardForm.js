import { useState } from "react";
import '../styles/components/CreateLeaderboardForm.css'

const CreateLeaderboardForm = ({show}) => {
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
        <div className={'create-leaderboard' + (show ? '' : ' hidden')}>
            <form className="create-leaderboard-form" onSubmit={handleSubmit}>
                <label htmlFor="steam-url">Steam Page URL:</label>
                <input id="steam-url" type="text" onChange={(e) => setURL(e.target.value)} value={url}/>
                <button className="btn btn-ghost">+</button>
            </form>
        </div>
    );
}
 
export default CreateLeaderboardForm;