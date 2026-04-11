import { Link } from 'react-router-dom';
import LogoutButton from './LogoutButton';
import {useEffect, useRef} from "react";
import '../styles/components/Navbar.css';

const Navbar = ({ user, setUser, motw }) => {
    const headerRef = useRef(null);

    useEffect(() => {
        if (!headerRef.current) return;

        const updateHeight = () => {
            const height = headerRef.current.offsetHeight;
            document.documentElement.style.setProperty('--header-height', `${height}px`);
        };
        headerRef.current.addEventListener('transitionend', (e) => {
            if (e.propertyName === 'padding-top' || e.propertyName === 'padding-bottom') updateHeight();
        });
        updateHeight();

        return () => {}
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
                    <span className="logo">Pogostuck Leaderboards</span>
                </Link>
                <ul>
                    <Link to="/points-leaderboard"><li>Leaderboard</li></Link>
                    <Link to={`/${motw.steamID}`}><li>Map of the Week</li></Link>
                    {user.userName && <Link to={`/user/${user.discordID}`}><li>{ user.userName }</li></Link>}
                    {!user.userName && <Link to="/login"><button className='btn btn-ghost btn-header'>Login</button></Link>}
                    {!user.userName && <Link to="/sign-up"><button className='btn btn-primary btn-header'>Sign Up</button></Link>}
                    {user.userName && <LogoutButton setUser={setUser} />}
                </ul>
            </nav>
        </header>
    )
}

export default Navbar;