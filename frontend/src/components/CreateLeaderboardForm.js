import { useState } from "react";
import '../styles/components/CreateLeaderboardForm.css'
import useApi from "../hooks/useApi";

const CreateLeaderboardForm = ({show}) => {
    const api = useApi();
    const [url, setURL] = useState('');
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (url === '') return;

        try {
            await api.leaderboards.createMapLeaderboard(url);
            setURL('');
            window.location.reload();
        } catch (err) {
            // Errors are already shown by the API layer.
        }
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