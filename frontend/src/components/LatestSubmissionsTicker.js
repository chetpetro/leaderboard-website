import {Component} from "react";
import "../styles/components/LatestSubmissionsTicker.css";
import { msToTime } from "../timeUtils";
import {playEmote} from "./EmoteWheel";
import {Link} from "react-router-dom";

class LatestSubmissionsTicker extends Component {

    constructor(props) {
        super(props);
        this.itemRefs = []
    }

    triggerWave() {
        this.itemRefs.forEach(item => playEmote('top', item));
    }

    buildEntryKey(entry, index) {
        return entry.key || `${entry.steamID || "map"}-${entry.discordID || entry.userName || "entry"}-${entry.submittedTimestamp || 0}-${index}`;
    }

    renderTrack(entries, prefix, hidden = false) {
        return (
            <div className="latest-submissions-ticker__track" aria-hidden={hidden}>
                {entries.map((entry, index) => (
                    <span className={`latest-submissions-ticker__item ${index}`}
                            key={`${prefix}-${this.buildEntryKey(entry, index)}`}>
                        <span className="media-container" ref={el => this.itemRefs[index + (prefix === "clone" ? 100 : 0)] = el}>
                            <img src="/bee.png" alt="junker"/>
                        </span>
                        <span className="submission-text">
                            <span className={`submission-segment submission-user`}>
                                <Link className="submission-segment__value" to={`/user/${entry.discordID}`}>{entry.userName}</Link>
                            </span>
                            <span className={`submission-segment submission-map`}>
                                <span className="submission-separator"> - </span>
                                <Link className="submission-segment__value" to={`/${entry.steamID}`}>{entry.mapName}</Link>
                            </span>
                            <span className={`submission-segment submission-time`}>
                                <span className="submission-separator"> - </span>
                                <span className="submission-segment__value">{msToTime(entry.time)}</span>
                            </span>
                        </span>
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
