import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Signup = ({ setUser }) => {
    const [userName, setUserName] = useState('')
    const [discordID, setDiscordID] = useState('')
    const [password, setPassword] = useState('')


    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault()

        const response = await fetch('https://leaderboard-website-api.vercel.app/api/user/sign-up', {
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

    useEffect(() => {
        const fragment = new URLSearchParams(window.location.hash.slice(1));
		const [accessToken, tokenType] = [fragment.get('access_token'), fragment.get('token_type')];

        if (accessToken){
            fetch('https://leaderboard-website-api.vercel.app/api/user/sign-up-discord', {
                method:"POST",
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({tokenType, accessToken})
            })
            .then(response => response.json())
            .then(json => {
                localStorage.setItem('user', JSON.stringify(json));
                setUser({userName: json.userName, discordID: json.discordID, token: json.token})
                navigate('/');
            })
            .catch((error) => console.log("Sign Up Discord Error: " + error))
        }
    }, [])

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
            <a href="https://discord.com/oauth2/authorize?client_id=1263159916512677918&response_type=token&redirect_uri=https%3A%2F%2Fpogostuckleaderboards.vercel.app%2Fsign-up&scope=identify"><div className="discord-button" >Sign Up with Discord<img className="discord-icon" src="https://static-00.iconduck.com/assets.00/discord-icon-2048x1570-y371emu6.png"/></div></a>
        </form>
    );
}
 
export default Signup;