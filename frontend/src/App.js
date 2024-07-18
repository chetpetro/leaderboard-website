import { BrowserRouter, Routes, Route } from 'react-router-dom';

// pages
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from "./pages/Login"
import Signup from './pages/Signup';
import LeaderboardDetails from './pages/LeaderboardDetails';
import { useState, useEffect } from 'react';
import User from './pages/User';
import PointsLeaderboard from './pages/PointsLeaderboard';

function App() {

  const [user, setUser] = useState({ 
    userName: '',
    discordID: '',
    token: ''
  })
  const [motw, setMOTW] = useState('');

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      setUser(JSON.parse(user));
    }

    const fetchMOTW = async () => {
      const response = await fetch('/api/leaderboards/motw');
      const json = await response.json();
      
      if (response.ok) setMOTW(json)
    }

    fetchMOTW()
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Navbar user={user} setUser={setUser} motw={motw}/>
        <div className="pages">
          <Routes>
            <Route exact path='/' element={<Home motw={motw}/>}/>
            <Route path='/:name' element={<LeaderboardDetails user={user} motw={motw}/>} />
            <Route path='/user/:discordID' element={<User />}/>
            <Route path='/login' element={<Login setUser={setUser}/>} />
            <Route path='/sign-up' element={<Signup setUser={setUser}/>} />
            <Route path='/points-leaderboard' element={<PointsLeaderboard />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
