const START_OF_FIRST_MOTW_UTC = Date.UTC(2026, 3, 27, 0, 0, 0, 0);
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function getMotwNumber(date = new Date()) {
    const currentTime = date instanceof Date ? date.getTime() : new Date(date).getTime();

    if (Number.isNaN(currentTime)) {
        throw new Error('Invalid date provided');
    }

    return Math.max(0, Math.floor((currentTime - START_OF_FIRST_MOTW_UTC) / WEEK_MS));
}

module.exports = {
    START_OF_FIRST_MOTW_UTC,
    getMotwNumber
};

