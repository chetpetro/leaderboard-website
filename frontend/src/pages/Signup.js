import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Signup = ({ setUser }) => {
    const [userName, setUserName] = useState('')
    const [discordID, setDiscordID] = useState('')
    const [password, setPassword] = useState('')

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault()

        const response = await fetch('/api/user/sign-up', {
            method:"POST",
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({userName, discordID, password})
        });
        const json = await response.json()

        if (!response.ok) throw Error(json.error);
        
        // Store user in local storage
        localStorage.setItem('user', JSON.stringify(json));
        
        setUser({userName, discordID, token: json.token});

        navigate('/');
    }

    return (
        <form className="signup" onSubmit={handleSubmit}>
            <h3>Sign Up</h3>

            <label>Username:</label>
            <input type="text" onChange={(e) => setUserName(e.target.value)} value={userName}/>
            <label>Discord ID:</label>
            <input type="number" onChange={(e) => setDiscordID(e.target.value)} value={discordID}/>
            <label>Password:</label>
            <input type="text" onChange={(e) => setPassword(e.target.value)} value={password}/>
            <button>Sign Up</button>
        </form>
    );
}
 
export default Signup;