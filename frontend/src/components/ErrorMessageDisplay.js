import {Component} from "react";
import '../styles/components/ErrorMessageDisplay.css'

class ErrorMessageDisplay extends Component {
    render() {
        return (
            <div className="error-message-display">
                <div className="message error-message">
                    <h3>Something Happened</h3>
                    <p> Contact People on the Pogostuck Discord</p>
                </div>
            </div>
        )
    }
}

export default ErrorMessageDisplay;