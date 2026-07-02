export const getMapKey = (map) => map?.mapKey || map?.steamID || map?.id || '';

export const getMapPath = (map) => {
    const mapKey = typeof map === 'string' ? map : getMapKey(map);
    return mapKey ? `/leaderboards/${mapKey}` : '/leaderboards';
};
