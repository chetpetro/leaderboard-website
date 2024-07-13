import { useNavigate } from "react-router-dom";

const LogoutButton = ({ setUser}) => {
    const navigate = useNavigate();

    const handleClick = () => {
        setUser({ 
            userName: '',
            discordID: ''
        });

        localStorage.removeItem('user')

        navigate('/');
    }

    return (
        <button onClick={handleClick} className="logout-button">Logout</button>
    );
}
 
export default LogoutButton;