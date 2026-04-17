import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useError } from '../context/ErrorContext';

const AdminPanel = ({ user }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const { showError } = useError();

    useEffect(() => {
        const checkAdminAccess = async () => {
            if (!user?.token) {
                setIsAuthorized(false);
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch('https://leaderboard-website-api.vercel.app/api/admin/status', {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                });

                setIsAuthorized(response.ok);
            } catch (error) {
                showError(error.message || 'Could not verify admin access.');
                setIsAuthorized(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAdminAccess();
    }, [showError, user?.token]);

    if (!user?.token || !user?.isAdmin) return <Navigate to="/" replace />;
    if (isLoading) return <h2>Checking admin access...</h2>;
    if (!isAuthorized) return <Navigate to="/" replace />;

    return (
        <div className="admin-panel">
            <div className="card">
                <h1>Admin Panel</h1>
                <p>Admin area is ready. Tools will be added here next.</p>
            </div>
        </div>
    );
};

export default AdminPanel;

