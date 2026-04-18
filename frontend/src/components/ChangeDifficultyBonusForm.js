import { useState } from "react";
import { useError } from "../context/ErrorContext";
import '../styles/components/ChangeDifficultyBonusForm.css';

const API_BASE_URL = 'https://leaderboard-website-api.vercel.app/api';

const ChangeDifficultyBonusForm = ({ steamID, user, onDifficultyChanged, map }) => {
    const { showError } = useError();
    const [difficultyBonus, setDifficultyBonus] = useState(map.difficultyBonus);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (difficultyBonus === '') {
            showError('Difficulty bonus must be a number.');
            return;
        }

        const parsedDifficultyBonus = Number(difficultyBonus);
        if (!Number.isFinite(parsedDifficultyBonus)) {
            showError('Difficulty bonus must be a number.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/leaderboards/${steamID}/difficultyBonus`, {
                method: 'PATCH',
                body: JSON.stringify({ difficultyBonus: parsedDifficultyBonus }),
                headers: {
                    'Content-Type': 'application/json',
                    ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {})
                }
            });

            const json = await response.json().catch(() => ({}));
            if (!response.ok) {
                showError(json?.error || 'Failed to update difficulty bonus.');
                return;
            }
            onDifficultyChanged?.();
        } catch (err) {
            showError(err.message || 'Failed to update difficulty bonus.');
        }
    };

    return (
        <form className="change-difficulty-bonus-form" onSubmit={handleSubmit}>
            <h2>Change Difficulty Bonus</h2>
            <label htmlFor="difficulty-bonus-input">Difficulty Bonus:</label>
            <div className="input-cnt">
                <input
                    id="difficulty-bonus-input"
                    type="number"
                    onChange={(e) => setDifficultyBonus(e.target.value)}
                    value={difficultyBonus}
                />
                <button className="btn btn-primary btn-small">Save</button>
            </div>
        </form>
    );
};

export default ChangeDifficultyBonusForm;

