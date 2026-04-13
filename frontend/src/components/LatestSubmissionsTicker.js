import {Component} from "react";
import "../styles/components/LatestSubmissionsTicker.css";
import { msToTime } from "../timeUtils";

class LatestSubmissionsTicker extends Component {
    formatSubmissionLabel(entry) {
        const segments = [
            { className: "submission-user", value: entry.userName },
            { className: "submission-map", value: entry.mapName },
            { className: "submission-time", value: msToTime(entry.time) }
        ];

        if (entry.submittedTimestamp > 0) {
            segments.push({
                className: "submission-date",
                value: new Date(entry.submittedTimestamp).toLocaleDateString()
            });
        }

        return segments.map((segment, index) => (
            <span className={`submission-segment ${segment.className}`} key={`${segment.className}-${index}`}>
                {index > 0 && <span className="submission-separator"> - </span>}
                <span className="submission-segment__value">{segment.value}</span>
            </span>
        ));
    }

    buildEntryKey(entry, index) {
        return entry.key || `${entry.steamID || "map"}-${entry.discordID || entry.userName || "entry"}-${entry.submittedTimestamp || 0}-${index}`;
    }

    renderTrack(entries, prefix, hidden = false) {
        return (
            <div className="latest-submissions-ticker__track" aria-hidden={hidden}>
                {entries.map((entry, index) => (
                    <span className="latest-submissions-ticker__item" key={`${prefix}-${this.buildEntryKey(entry, index)}`}>
                        <span className="media-container">
                            <img src="/bee.png" alt="junker"/>
                        </span>
                        <span className="submission-text">{this.formatSubmissionLabel(entry)}</span>
                    </span>
                ))}
            </div>
        );
    }

    render() {
        const submissions = Array.isArray(this.props.submissions) ? this.props.submissions : [];
        return (
            <div className={"latest-submissions-ticker " + (submissions.length === 0 ? 'hidden' : '')} role="region" aria-label="Latest submissions">
                <div className="latest-submissions-ticker__viewport">
                    {submissions.length > 0 && (
                        <div className="latest-submissions-ticker__content">
                            {this.renderTrack(submissions, "primary")}
                            {this.renderTrack(submissions, "clone", true)}
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

export default LatestSubmissionsTicker;
