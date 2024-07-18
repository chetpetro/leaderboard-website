import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = ({ setUser }) => {
    const [userName, setUserName] = useState('')
    const [password, setPassword] = useState('')

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        const response = await fetch('/api/user/login', {
            method:"POST",
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({userName, password})
        });
        const json = await response.json()

        if (!response.ok) throw Error(json.error);
        
        // Store user in local storage
        localStorage.setItem('user', JSON.stringify(json));
        
        setUser({userName, discordID: json.discordID, token: json.token});

        navigate('/');
    }

    useEffect(() => {
        const fragment = new URLSearchParams(window.location.hash.slice(1));
		const [accessToken, tokenType] = [fragment.get('access_token'), fragment.get('token_type')];

        if (accessToken){
            fetch('/api/user/login-discord', {
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
            .catch((error) => console.log("Login Discord Error: " + error))
        }
    }, []);

    return (
        <form className="login" onSubmit={handleSubmit}>
            <h3>Login</h3>

            <label>Username:</label>
            <input type="text" onChange={(e) => setUserName(e.target.value)} value={userName}/>
            <label>Password:</label>
            <input type="text" onChange={(e) => setPassword(e.target.value)} value={password}/>
            <button>Login</button>
            <a href="https://discord.com/oauth2/authorize?client_id=1263159916512677918&response_type=token&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Flogin&scope=identify"><div className="discord-button" >Login with Discord<img className="discord-icon" src="https://static-00.iconduck.com/assets.00/discord-icon-2048x1570-y371emu6.png"/></div></a>
        </form>
    );
}
 
export default Login;