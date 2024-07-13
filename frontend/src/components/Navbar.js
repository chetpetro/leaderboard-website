import { Link } from 'react-router-dom';
import LogoutButton from './LogoutButton';

const Navbar = ({ user, setUser, motw }) => {

    return (
        <header>
            <nav>
                <Link to="/">
                    <h1 style={{fontSize: "2em"}}>Pogostuck Leaderboards</h1>
                </Link>
                <ul>
                    <Link to="/"><li>Home</li></Link>
                    {motw.mapName && <Link to={`/${motw.mapName}`}><li>MotW: {motw.mapName}</li></Link>}
                    {user.userName && <Link to={`/user/${user.discordID}`}><li>{ user.userName }</li></Link>}
                    {!user.userName && <Link to="/login"><button className='login-button'>Login</button></Link>}
                    {!user.userName && <Link to="/sign-up"><button className='signup-button'>Sign Up</button></Link>}
                    {user.userName && <LogoutButton setUser={setUser} />}
                </ul>
            </nav>
        </header>
    )
}

export default Navbar;