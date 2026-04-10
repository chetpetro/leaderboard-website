import { Link } from 'react-router-dom';
import LogoutButton from './LogoutButton';
import {useEffect, useRef} from "react";

const Navbar = ({ user, setUser, motw }) => {
    const headerRef = useRef(null);

    useEffect(() => {
        if (!headerRef.current) return;

        const updateHeight = () => {
            const height = headerRef.current.offsetHeight;
            document.documentElement.style.setProperty('--header-height', `${height}px`);
        };

        const resizeObserver = new ResizeObserver(() => updateHeight());
        resizeObserver.observe(headerRef.current);

        updateHeight();

        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (!headerRef.current) return;

        const handleScroll = () => {
            const headerEl = headerRef.current;
            if (!headerEl) return;

            const y = window.scrollY;
            const isScrolled = headerEl.classList.contains('scrolled');

            if (!isScrolled && y > 100) {
                headerEl.classList.add('scrolled');
            } else if (isScrolled && y < 50) {
                headerEl.classList.remove('scrolled');
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header ref={headerRef}>
            <nav>
                <Link to="/">
                    <h1 style={{fontSize: "2em"}}>Pogostuck Leaderboards</h1>
                </Link>
                <ul>
                    <Link to="/"><li>Home</li></Link>
                    <Link to="/points-leaderboard"><li>Points</li></Link>
                    {motw.mapName && <Link to={`/${motw.steamID}`}><li>MotW: {motw.mapName}</li></Link>}
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