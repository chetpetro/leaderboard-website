export class LeaderboardsApi {
  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  fetchAll() {
    return this.httpClient.request('/leaderboards', {
      errorMessage: 'Failed to load leaderboards.'
    });
  }

  fetchBySteamID(steamID) {
    return this.httpClient.request(`/leaderboards/${steamID}`, {
      errorMessage: 'Failed to load map details.'
    });
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

  createOrEditEntry(steamID, entry, token) {
    return this.httpClient.request(`/leaderboards/${steamID}`, {
      method: 'PATCH',
      token,
      body: entry,
      errorMessage: 'Failed to submit entry.'
    });
  }

  updateDifficultyBonus(steamID, difficultyBonus, token) {
    return this.httpClient.request(`/leaderboards/${steamID}/difficultyBonus`, {
      method: 'PATCH',
      token,
      body: { difficultyBonus },
      errorMessage: 'Failed to update difficulty bonus.'
    });
  }
}

