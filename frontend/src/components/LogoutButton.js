import { useNavigate } from "react-router-dom";

const LogoutButton = ({ setUser}) => {
    const navigate = useNavigate();

    const handleClick = () => {
        setUser({ 
            userName: '',
            discordID: '',
            token: '',
            isAdmin: false
        });

        localStorage.removeItem('user')

        navigate('/');
    }

    return (
        <button onClick={handleClick} className="btn btn-ghost btn-header">Logout</button>
    );
}
 
export default LogoutButton;