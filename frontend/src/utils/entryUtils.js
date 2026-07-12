// Mirrors the backend comparator (backend/controllers/leaderboard/mapUtils.js):
// on boostless maps fewer boosts always beats a faster time; missing boosts count as 0.
const getEntryBoosts = (entry) => {
    const boosts = Number(entry?.boosts);
    return Number.isFinite(boosts) ? boosts : 0;
};

export const compareEntries = (a, b, isBoostless) => {
    if (isBoostless) {
        const boostsDiff = getEntryBoosts(a) - getEntryBoosts(b);
        if (boostsDiff !== 0) return boostsDiff;
    }
    return Number(a?.time) - Number(b?.time);
};
