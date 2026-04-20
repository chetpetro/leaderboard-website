import {useState, useEffect, useCallback} from "react";
import { useNavigate } from "react-router-dom";
import '../styles/pages/Signup.css'
import useApi from "../hooks/useApi";

const Login = ({ setUser }) => {
    const api = useApi();
    const [userName, setUserName] = useState('')
    const [password, setPassword] = useState('')

    const navigate = useNavigate();

    const setUserWithUsernameFromJson = useCallback((userName, json) => {
        setUser({userName, discordID: json.discordID, token: json.token, isAdmin: json.isAdmin, mapPoints: json.mapPoints});
    }, [setUser]);

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const json = await api.user.login({userName, password});

            // Store user in local storage
            localStorage.setItem('user', JSON.stringify(json));

            setUserWithUsernameFromJson(userName, json);

            navigate('/');
        } catch (error) {
            // Errors are already shown by the API layer.
        }
    }

    useEffect(() => {
        const loginWithDiscord = async () => {
            try {
                const fragment = new URLSearchParams(window.location.hash.slice(1));
                const [accessToken, tokenType] = [fragment.get('access_token'), fragment.get('token_type')];

                if (!accessToken) return;

                const json = await api.user.loginDiscord({ tokenType, accessToken });
                localStorage.setItem('user', JSON.stringify(json));
                setUserWithUsernameFromJson(json.userName, json);
                navigate('/');
            } catch (error) {
                // Errors are already shown by the API layer.
            }
        };

        loginWithDiscord();
    }, [api, navigate, setUserWithUsernameFromJson]);

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