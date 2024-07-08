import { BrowserRouter, Routes, Route } from 'react-router-dom';

// pages
import Navbar from './components/Navbar';
import Home from './pages/Home';
import LeaderboardDetails from './pages/LeaderboardDetails';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Navbar />
        <div className="pages">
          <Routes>
            <Route exact path='/' element={<Home />}/>
            <Route path='/:name' element={<LeaderboardDetails />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
