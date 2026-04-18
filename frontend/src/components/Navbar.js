import { Link } from 'react-router-dom';
import LogoutButton from './LogoutButton';
import {useEffect, useRef, useState} from "react";
import '../styles/components/Navbar.css';

const Navbar = ({ user, setUser, motw }) => {
    const headerRef = useRef(null);
    const menuButtonRef = useRef(null);
    const firstMobileLinkRef = useRef(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const wasMenuOpenRef = useRef(false);

    useEffect(() => {
        if (!headerRef.current) return;

        const updateHeight = () => {
            const height = headerRef.current.offsetHeight;
            document.documentElement.style.setProperty('--header-height', `${height}px`);
        };

        const handleTransitionEnd = (e) => {
            if (e.propertyName === 'padding-top' || e.propertyName === 'padding-bottom') updateHeight();
        };

        headerRef.current.addEventListener('transitionend', handleTransitionEnd);
        const current = headerRef.current;
        updateHeight();

        return () => current.removeEventListener('transitionend', handleTransitionEnd);
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

    useEffect(() => {
        if (!isMenuOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isMenuOpen]);

    useEffect(() => {
        const htmlEl = document.documentElement;
        const bodyEl = document.body;
        const prevHtmlOverflow = htmlEl.style.overflow;
        const prevBodyOverflow = bodyEl.style.overflow;

        if (isMenuOpen) {
            htmlEl.style.overflow = 'hidden';
            bodyEl.style.overflow = 'hidden';
            firstMobileLinkRef.current?.focus();
        } else if (wasMenuOpenRef.current) {
            menuButtonRef.current?.focus();
        }

        wasMenuOpenRef.current = isMenuOpen;

        return () => {
            htmlEl.style.overflow = prevHtmlOverflow;
            bodyEl.style.overflow = prevBodyOverflow;
        };
    }, [isMenuOpen]);

    const closeMenu = () => setIsMenuOpen(false);

    return (
        <header ref={headerRef}>
            <nav>
                <Link to="/">
                    <span className="logo">Pogostuck Leaderboards</span>
                </Link>
                <button
                    ref={menuButtonRef}
                    type="button"
                    className={`hamburger ${isMenuOpen ? 'is-open' : ''}`}
                    aria-expanded={isMenuOpen}
                    aria-controls="mobile-nav"
                    aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                >
                    <span aria-hidden="true" />
                    <span aria-hidden="true" />
                    <span aria-hidden="true" />
                </button>
                <ul className="desktop-nav-links">
                    <li><Link to="/points-leaderboard">Leaderboard</Link></li>
                    {user.userName && <li><Link to={`/user/${user.discordID}`} title={user.userName}>
                        <div className="user-icon media-container">
                            <img src="/user.svg" alt="user" />
                        </div>
                    </Link></li>}
                    {!user.userName && <li><Link to="/login"><button className='btn btn-ghost btn-header'>Login</button></Link></li>}
                    {!user.userName && <li><Link to="/sign-up"><button className='btn btn-primary btn-header'>Sign Up</button></Link></li>}
                    {user.userName && <li><LogoutButton setUser={setUser} /></li>}
                </ul>
            </nav>

            <button
                type="button"
                className={`mobile-overlay ${isMenuOpen ? 'open' : ''}`}
                aria-label="Close navigation menu"
                onClick={closeMenu}
            />
            <aside id="mobile-nav" className={`mobile-drawer ${isMenuOpen ? 'open' : ''}`} aria-hidden={!isMenuOpen}>
                <button
                    type="button"
                    className="drawer-close-btn"
                    aria-label="Close navigation menu"
                    onClick={closeMenu}
                >
                    <span aria-hidden="true">&times;</span>
                </button>
                <nav aria-label="Mobile">
                    <ul>
                        <li><Link ref={firstMobileLinkRef} to="/points-leaderboard" onClick={closeMenu}>Leaderboard</Link></li>
                        {user.userName && <li><Link to={`/user/${user.discordID}`} title={user.userName}>
                            <div className="user-icon media-container">
                                <img src="/user.svg" alt="user" />
                            </div>
                        </Link></li>}
                        {!user.userName && <li><Link to="/login" onClick={closeMenu}>Login</Link></li>}
                        {!user.userName && <li><Link to="/sign-up" onClick={closeMenu}>Sign Up</Link></li>}
                        {user.userName && <li><LogoutButton setUser={setUser} /></li>}
                    </ul>
                </nav>
            </aside>
        </header>
    )
}

export default Navbar;