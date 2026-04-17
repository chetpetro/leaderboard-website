import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/Signup.css'
import { useError } from '../context/ErrorContext';

const Login = ({ setUser }) => {
    const [userName, setUserName] = useState('')
    const [password, setPassword] = useState('')
    const { showError } = useError();

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const response = await fetch('https://leaderboard-website-api.vercel.app/api/user/login', {
                method:"POST",
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({userName, password})
            });
            const json = await response.json()

            if (!response.ok) {
                showError(json.error || 'Login failed');
                return;
            }

            // Store user in local storage
            localStorage.setItem('user', JSON.stringify(json));

            setUser({userName, discordID: json.discordID, token: json.token, isAdmin: json.isAdmin});

            navigate('/');
        } catch (error) {
            showError(error.message || 'Login failed. Please try again.');
        }
    }

    useEffect(() => {
        const fragment = new URLSearchParams(window.location.hash.slice(1));
		const [accessToken, tokenType] = [fragment.get('access_token'), fragment.get('token_type')];

        if (accessToken){
            fetch('https://leaderboard-website-api.vercel.app/api/user/login-discord', {
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
            .catch((error) => {
                showError(error.message || 'Discord login failed. Please try again.');
                console.log("Login Discord Error: " + error)
            })
        }
    }, [navigate, setUser, showError]);

    return (
        <div className="login">
            <div className="inside">
                <form className="login-form card" onSubmit={handleSubmit}>
                    <h1>Login</h1>

                    <label>Username:</label>
                    <input type="text" onChange={(e) => setUserName(e.target.value)} value={userName}/>
                    <label>Password:</label>
                    <input type="text" onChange={(e) => setPassword(e.target.value)} value={password}/>
                    <div className="btn-container justify-start">
                        <button className="btn btn-ghost btn-form">Login</button>
                        <a className="btn btn-discord btn-form" href="https://discord.com/oauth2/authorize?client_id=1263159916512677918&response_type=token&redirect_uri=https%3A%2F%2Fpogostuckleaderboards.vercel.app%2Flogin&scope=identify">
                            <span className="inside">
                                <span className="btn-text">Login with Discord</span>
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
 
export default Login;