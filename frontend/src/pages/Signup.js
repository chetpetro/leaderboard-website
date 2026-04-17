import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/pages/Signup.css'
import { useError } from '../context/ErrorContext';

const Signup = ({ setUser }) => {
    const [userName, setUserName] = useState('')
    const [discordID, setDiscordID] = useState('')
    const [password, setPassword] = useState('')
    const { showError } = useError();


    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const response = await fetch('https://leaderboard-website-api.vercel.app/api/user/sign-up', {
                method:"POST",
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({userName, discordID, password, isAdmin: false})
            });
            const json = await response.json()

            if (!response.ok) {
                showError(json.error || 'Sign up failed');
                return;
            }

            // Store user in local storage
            localStorage.setItem('user', JSON.stringify(json));

            setUser({userName, discordID, token: json.token, isAdmin: json.isAdmin});

            navigate('/');
        } catch (error) {
            showError(error.message || 'Sign up failed. Please try again.');
        }
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
                setUser({userName: json.userName, discordID: json.discordID, token: json.token, isAdmin: json.isAdmin});
                navigate('/');
            })
            .catch((error) => {
                showError(error.message || 'Discord sign up failed. Please try again.');
                console.log("Sign Up Discord Error: " + error)
            })
        }
    }, [navigate, setUser, showError])

    return (
        <div className="signup">
            <div className="inside">
                <form className="signup-form card" onSubmit={handleSubmit}>
                    <h1>Sign Up</h1>

                    <label>Username:</label>
                    <input type="text" onChange={(e) => setUserName(e.target.value)} value={userName}/>
                    <label>Discord ID:</label>
                    <input type="number" onChange={(e) => setDiscordID(e.target.value)} value={discordID}/>
                    <label>Password:</label>
                    <input type="text" onChange={(e) => setPassword(e.target.value)} value={password}/>
                    <div className="btn-container justify-start">
                        <button className="btn btn-ghost">Sign Up</button>
                        <a className="btn btn-discord" href="https://discord.com/oauth2/authorize?client_id=1263159916512677918&response_type=token&redirect_uri=https%3A%2F%2Fpogostuckleaderboards.vercel.app%2Fsign-up&scope=identify">
                        <span className="inside">
                                <span className="btn-text">Sign Up with Discord</span>
                            <span className="media-container"><img className="discord-icon" alt="discord icon"
                                                                   src="/discord.svg"/></span>
                        </span>
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}
 
export default Signup;