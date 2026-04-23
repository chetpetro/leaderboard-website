import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from "./pages/Login"
import Signup from './pages/Signup';
import MapDetails from './pages/MapDetails';
import { useState, useEffect } from 'react';
import User from './pages/UserDetails';
import PointsLeaderboard from './pages/PointsLeaderboard';
import ErrorMessageDisplay from "./components/ErrorMessageDisplay";
import { ErrorProvider } from './context/ErrorContext';
import HardestMaps from "./pages/HardestMaps";
import useApi from './hooks/useApi';
import {Footer} from "./components/Footer";

function AppContent() {
  const api = useApi();

  const [user, setUser] = useState({
    userName: '',
    discordID: '',
    token: '',
    isAdmin: false,
    mapPoints: [],
  })
  const [motw, setMOTW] = useState('');

  useEffect(() => {
    const initializeUser = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;

      let parsedUser;
      try {
        parsedUser = JSON.parse(storedUser);
      } catch (error) {
        localStorage.removeItem('user');
        parsedUser = null;
      }

      if (!parsedUser) return;

      // Validate JWT token
      try {
        await api.user.validateToken(parsedUser.token);
      } catch (error) {
        // Token is expired or invalid, clear the user
        localStorage.removeItem('user');
        setUser({
          userName: '',
          discordID: '',
          token: '',
          isAdmin: false,
          mapPoints: [],
        });
        return;
      }

      setUser(parsedUser);

      try {
        await api.user.updatePoints(parsedUser.discordID);
      } catch (error) {
        // Errors are already shown by the API layer.
      }
    };

    initializeUser();
  }, [api]);


  useEffect(() => {
    const fetchMOTW = async () => {
      try {
        const json = await api.leaderboards.fetchMOTW();
        setMOTW(json);
      } catch (error) {
        // Errors are already shown by the API layer.
      }
    };

    fetchMOTW();
  }, [api]);

  return (
    <div className="App">
      <ErrorMessageDisplay/>
      <BrowserRouter>
        <Navbar user={user} setUser={setUser} motw={motw}/>
        <div className="pages">
          <Routes>
            <Route exact path='/' element={<Home motw={motw}/>} />
            <Route path='/:steamID' element={<MapDetails user={user} />} />
            <Route path='/user/:discordID' element={<User />}/>
            <Route path='/login' element={<Login setUser={setUser}/>} />
            <Route path='/sign-up' element={<Signup setUser={setUser}/>} />
            <Route path='/points-leaderboard' element={<PointsLeaderboard />} />
            <Route path='/hardest-maps' element={<HardestMaps />} />
          </Routes>
        </div>
        <Footer/>
      </BrowserRouter>
    </div>
  );
}

function App() {
  return (
    <ErrorProvider>
      <AppContent />
    </ErrorProvider>
  );
}

export default App;
