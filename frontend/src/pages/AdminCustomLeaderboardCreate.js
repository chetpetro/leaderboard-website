import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAdminAuthorization from '../hooks/useAdminAuthorization';
import useApi from '../hooks/useApi';

const AdminCustomLeaderboardCreate = ({ user }) => {
    const api = useApi();
    const navigate = useNavigate();
    const { isAuthorized, isLoading } = useAdminAuthorization(user);
    const [form, setForm] = useState({
        id: '',
        mapName: '',
        creator: 'Superku',
        description: '',
        difficultyBonus: '0'
    });

    const handleChange = (field) => (event) => {
        setForm((prev) => ({
            ...prev,
            [field]: event.target.value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const created = await api.leaderboards.createCustomLeaderboard(
                {
                    ...form,
                    difficultyBonus: Number(form.difficultyBonus)
                },
                user?.token
            );

            navigate(`/leaderboards/${created.mapKey || created.id}`);
        } catch (error) {
            // Errors are already shown by the API layer.
        }
    };

    if (isLoading) {
        return <div className="inside"><h1>Checking admin access...</h1></div>;
    }

    if (!isAuthorized) {
        return <div className="inside"><h1>Admin access required</h1></div>;
    }

    return (
        <div className="inside">
            <h1>Create Custom Leaderboard</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="custom-id">ID</label>
                    <input id="custom-id" type="text" value={form.id} onChange={handleChange('id')} />
                </div>
                <div>
                    <label htmlFor="custom-name">Map Name</label>
                    <input id="custom-name" type="text" value={form.mapName} onChange={handleChange('mapName')} />
                </div>
                <div>
                    <label htmlFor="custom-creator">Creator</label>
                    <input id="custom-creator" type="text" value={form.creator} onChange={handleChange('creator')} />
                </div>
                <div>
                    <label htmlFor="custom-description">Description</label>
                    <textarea id="custom-description" value={form.description} onChange={handleChange('description')} />
                </div>
                <div>
                    <label htmlFor="custom-difficulty-bonus">Difficulty Bonus</label>
                    <input id="custom-difficulty-bonus" type="number" value={form.difficultyBonus} onChange={handleChange('difficultyBonus')} />
                </div>
                <button className="btn btn-primary" type="submit">Create</button>
            </form>
        </div>
    );
};

export default AdminCustomLeaderboardCreate;
