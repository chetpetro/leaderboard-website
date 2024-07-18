import { useState, useEffect } from "react";
import LeadearboardPreview from "../components/LeaderboardPreview";
import CreateLeaderboardForm from "../components/CreateLeaderboardForm";

const Home = ({ motw }) => {
    const [leaderboards, setLeaderboards] = useState('');

    useEffect(() => {
        const fetchLeaderboards = async () => {
            const response = await fetch('/api/leaderboards');
            const json = await response.json();

            if (response.ok) {
                setLeaderboards(json);
            }
        }

        fetchLeaderboards();

    }, [])
    
    return (
        <div className="home">
            <div className="leaderboards">
                {leaderboards && leaderboards.sort((a, b) => b.entries.length - a.entries.length).map((leaderboard) => (
                    <LeadearboardPreview key={leaderboard._id} leaderboard={leaderboard} motw={motw}/>
                ))}
            </div>
            <CreateLeaderboardForm />
        </div>    
    );
}
 
export default Home;