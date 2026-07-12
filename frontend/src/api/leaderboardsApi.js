export class LeaderboardsApi {
  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  fetchAll() {
    return this.httpClient.request('/leaderboards', {
      errorMessage: 'Failed to load leaderboards.'
    });
  }

  browse({ sort = 'mostPlayed', bonusOnly = false, boostless = false, limit = 9, offset = 0 } = {}) {
    const params = new URLSearchParams({
      sort,
      limit: String(limit),
      offset: String(offset)
    });
    if (bonusOnly) params.set('bonusOnly', 'true');
    if (boostless) params.set('boostless', 'true');

    return this.httpClient.request(`/leaderboards/browse?${params}`, {
      errorMessage: 'Failed to load maps.'
    });
  }

  fetchByMapKey(mapKey) {
    return this.httpClient.request(`/leaderboards/${mapKey}`, {
      errorMessage: 'Failed to load map details.'
    });
  }

  fetchBySteamID(steamID) {
    return this.fetchByMapKey(steamID);
  }

  fetchMOTW() {
    return this.httpClient.request('/leaderboards/motw', {
      errorMessage: 'Failed to load map of the week.'
    });
  }

  fetchRecent(limit = 10) {
    return this.httpClient.request(`/leaderboards/recent?limit=${limit}`, {
      errorMessage: 'Failed to load recent maps.'
    });
  }

  fetchEntriesByUser(discordID) {
    return this.httpClient.request(`/leaderboards/entries?user=${discordID}`, {
      errorMessage: 'Failed to load user entries.'
    });
  }

  createMapLeaderboard(url) {
    return this.httpClient.request('/leaderboards/', {
      method: 'POST',
      body: { url },
      errorMessage: 'Failed to create leaderboard.'
    });
  }

  createCustomLeaderboard(payload, token) {
    return this.httpClient.request('/leaderboards/custom', {
      method: 'POST',
      token,
      body: payload,
      errorMessage: 'Failed to create custom leaderboard.'
    });
  }

  createOrEditEntry(mapKey, entry, token) {
    return this.httpClient.request(`/leaderboards/${mapKey}`, {
      method: 'PATCH',
      token,
      body: entry,
      errorMessage: 'Failed to submit entry.'
    });
  }

  createMotwEntry(mapKey, entry, token) {
    return this.httpClient.request(`/leaderboards/${mapKey}/motw`, {
      method: 'PATCH',
      token,
      body: entry,
      errorMessage: 'Failed to submit MOTW entry.'
    });
  }

  updateDifficultyBonus(mapKey, difficultyBonus, token) {
    return this.httpClient.request(`/leaderboards/${mapKey}/difficultyBonus`, {
      method: 'PATCH',
      token,
      body: { difficultyBonus },
      errorMessage: 'Failed to update difficulty bonus.'
    });
  }
}
