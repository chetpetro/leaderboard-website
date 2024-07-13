import { useState } from "react";
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

    return (
        <form className="login" onSubmit={handleSubmit}>
            <h3>Login</h3>

            <label>Username:</label>
            <input type="text" onChange={(e) => setUserName(e.target.value)} value={userName}/>
            <label>Password:</label>
            <input type="text" onChange={(e) => setPassword(e.target.value)} value={password}/>
            <button>Login</button>
        </form>
    );
}
 
export default Login;