const Leaderboard = require('../../models/LeaderboardModel');
const CustomLeaderboard = require('../../models/CustomLeaderboardModel');

const normalizeMapKey = (value) => {
    if (value === null || value === undefined) return null;
    const normalized = String(value).trim();
    return normalized || null;
};

const getMapKey = (map) => normalizeMapKey(map?.mapKey ?? map?.steamID ?? map?.id);

const withMapKey = (map) => {
    if (!map) return map;

    const plainMap = typeof map.toObject === 'function' ? map.toObject() : { ...map };
    const mapKey = getMapKey(plainMap);

    return {
        ...plainMap,
        mapKey,
        isCustomLeaderboard: plainMap.isCustomLeaderboard ?? Boolean(plainMap.id && !plainMap.steamID)
    };
};

const resolveLeaderboardByKey = async (mapKey) => {
    const normalizedMapKey = normalizeMapKey(mapKey);

    if (!normalizedMapKey) {
        return { map: null, mapType: null, mapKey: null };
    }

    const steamLeaderboard = await Leaderboard.findOne({ steamID: normalizedMapKey });
    if (steamLeaderboard) {
        return { map: steamLeaderboard, mapType: 'steam', mapKey: normalizedMapKey };
    }

    const customLeaderboard = await CustomLeaderboard.findOne({ id: normalizedMapKey });
    if (customLeaderboard) {
        return { map: customLeaderboard, mapType: 'custom', mapKey: normalizedMapKey };
    }

    return { map: null, mapType: null, mapKey: normalizedMapKey };
};

// Missing boosts count as 0 — only possible on legacy/non-boostless entries,
// since boostless submissions are validated to always carry boosts.
const getEntryBoosts = (entry) => {
    const boosts = Number(entry?.boosts);
    return Number.isFinite(boosts) ? boosts : 0;
};

const compareEntries = (a, b, isBoostless) => {
    if (isBoostless) {
        const boostsDiff = getEntryBoosts(a) - getEntryBoosts(b);
        if (boostsDiff !== 0) return boostsDiff;
    }
    return Number(a?.time) - Number(b?.time);
};

const isBetterEntry = (candidate, existing, isBoostless) => compareEntries(candidate, existing, isBoostless) < 0;

// On a boostless map, dropping the boost count alone makes an entry "better" (see compareEntries),
// regardless of time. This tells callers whether an improvement over `existingEntry` was boosts-driven.
const getBoostsPbInfo = (existingEntry, candidate, isBoostless) => {
    if (!isBoostless || !existingEntry) return { isBoostsPb: false, oldPbBoosts: null };
    const oldPbBoosts = getEntryBoosts(existingEntry);
    const isBoostsPb = getEntryBoosts(candidate) < oldPbBoosts;
    return { isBoostsPb, oldPbBoosts };
};

const getMapRoutePath = (mapOrKey) => {
    const mapKey = normalizeMapKey(typeof mapOrKey === 'object' ? getMapKey(mapOrKey) : mapOrKey);
    return mapKey ? `/leaderboards/${encodeURIComponent(mapKey)}` : '/leaderboards';
};

module.exports = {
    compareEntries,
    getBoostsPbInfo,
    getEntryBoosts,
    getMapKey,
    getMapRoutePath,
    isBetterEntry,
    normalizeMapKey,
    resolveLeaderboardByKey,
    withMapKey
};
