import '../styles/components/ErrorMessageDisplay.css';
import { useError } from '../context/ErrorContext';

const ErrorMessageDisplay = () => {
    const { errors, clearError } = useError();

    if (!errors.length) {
        return null;
    }

    return (
        <div className="error-message-display">
            {errors.map((error) => (
                <div key={error.id} id={'error-id-' + error.id} className="message error-message" onClick={() => clearError(error.id)}>
                    <h3>Something Happened</h3>
                    <p>{error.message}</p>
                </div>
            ))}
        </div>
    );
};

export default ErrorMessageDisplay;