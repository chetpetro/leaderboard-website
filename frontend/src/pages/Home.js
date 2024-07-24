import { useState, useEffect } from "react";
import LeadearboardPreview from "../components/LeaderboardPreview";
import CreateLeaderboardForm from "../components/CreateLeaderboardForm";

const Home = ({ motw }) => {
    const [leaderboards, setLeaderboards] = useState('');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);
    const elementsPerPage = 15;

    useEffect(() => {
        const fetchLeaderboards = async () => {
            const response = await fetch('https://leaderboard-website-api.vercel.app/api/leaderboards');
            const json = await response.json();

            if (response.ok) {
                setLeaderboards(json);
            }
        }

        fetchLeaderboards();

    }, [])
    
    return (
        <div className="home">
            <div>
                <h4>Seach: <input type="text" onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(0)
                }} value={query}/></h4>
                <div className="leaderboards">
                    {leaderboards && leaderboards
                    .sort((a, b) => b.entries.length - a.entries.length)
                    .filter((el) => el.mapName.toLowerCase()
                    .includes(query.toLowerCase()))
                    .slice(page * elementsPerPage, (page + 1) * elementsPerPage)
                    .map((leaderboard) => (
                        <LeadearboardPreview key={leaderboard._id} leaderboard={leaderboard} />
                    ))}
                </div>
                <div className="page-button-container">
                    {page > 0 && <button onClick={() => setPage(page - 1)}>&#8592;</button>}
                    {page * elementsPerPage < leaderboards.length && <button onClick={() => setPage(page + 1)}>&#8594;</button>}
                </div>
            </div>
            <CreateLeaderboardForm />
        </div>    
    );
}
 
export default Home;