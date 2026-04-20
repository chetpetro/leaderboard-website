import {useState, useEffect, useCallback} from "react";
import { useNavigate } from "react-router-dom";
import '../styles/pages/Signup.css'
import useApi from "../hooks/useApi";

const Signup = ({ setUser }) => {
    const api = useApi();
    const [userName, setUserName] = useState('')
    const [discordID, setDiscordID] = useState('')
    const [password, setPassword] = useState('')

    const setUserWithUsernameAndDiscordIDFromJson = useCallback((userName, discordID, json) => {
        setUser({userName, discordID: discordID, token: json.token, isAdmin: json.isAdmin, mapPoints: json.mapPoints});
    }, [setUser]);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const json = await api.user.signup({userName, discordID, password, isAdmin: false, mapPoints: []});

            // Store user in local storage
            localStorage.setItem('user', JSON.stringify(json));
            setUserWithUsernameAndDiscordIDFromJson(userName, discordID, json);

            navigate('/');
        } catch (error) {
            // Errors are already shown by the API layer.
        }
    }

    useEffect(() => {
        const signupWithDiscord = async () => {
            try {
                const fragment = new URLSearchParams(window.location.hash.slice(1));
                const [accessToken, tokenType] = [fragment.get('access_token'), fragment.get('token_type')];

                if (!accessToken) return;

                const json = await api.user.signupDiscord({ tokenType, accessToken });
                localStorage.setItem('user', JSON.stringify(json));
                setUserWithUsernameAndDiscordIDFromJson(json.userName, json.discordID, json);
                navigate('/');
            } catch (error) {
                // Errors are already shown by the API layer.
            }
        };

        signupWithDiscord();
    }, [api, navigate, setUserWithUsernameAndDiscordIDFromJson])

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