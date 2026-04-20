import { useState } from "react";
import { useError } from "../context/ErrorContext";
import '../styles/components/ChangeDifficultyBonusForm.css';
import useApi from "../hooks/useApi";

const ChangeDifficultyBonusForm = ({ steamID, user, onDifficultyChanged, map }) => {
    const api = useApi();
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
            await api.leaderboards.updateDifficultyBonus(
                steamID,
                parsedDifficultyBonus,
                user?.token
            );
            onDifficultyChanged?.();
        } catch (err) {
            // Errors are already shown by the API layer.
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

