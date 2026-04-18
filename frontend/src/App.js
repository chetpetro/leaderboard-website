import { BrowserRouter, Routes, Route } from 'react-router-dom';

// pages
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from "./pages/Login"
import Signup from './pages/Signup';
import MapDetails from './pages/MapDetails';
import { useState, useEffect } from 'react';
import User from './pages/User';
import PointsLeaderboard from './pages/PointsLeaderboard';
import ErrorMessageDisplay from "./components/ErrorMessageDisplay";
import { ErrorProvider } from './context/ErrorContext';
import HardestMaps from "./pages/HardestMaps";

function App() {

  const [user, setUser] = useState({ 
    userName: '',
    discordID: '',
    token: '',
    isAdmin: false,
    newPoints: [],
  })
  const [motw, setMOTW] = useState('');

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      const parsedUser = JSON.parse(user);
      setUser({ ...parsedUser, newPoints: Array.isArray(parsedUser.newPoints) ? parsedUser.newPoints : [] });
    }

    const fetchMOTW = async () => {
      const response = await fetch('https://leaderboard-website-api.vercel.app/api/leaderboards/motw');
      const json = await response.json();
      
      if (response.ok) setMOTW(json)
    }

    fetchMOTW()
  }, []);

  return (
    <ErrorProvider>
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
        </BrowserRouter>
      </div>
    </ErrorProvider>
  );
}

export default App;
