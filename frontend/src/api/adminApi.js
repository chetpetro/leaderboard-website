export class AdminApi {
  constructor(httpClient) {
    this.httpClient = httpClient;
    this.logMapPoints = this.logMapPoints.bind(this);
  }

  fetchStatus(token) {
    return this.httpClient.request('/admin/status', {
      token,
      errorMessage: 'Could not verify admin access.'
    });
  }

  deleteEntry(steamID, discordID, token) {
    return this.httpClient.request(`/admin/leaderboards/${steamID}/entries/${discordID}`, {
      method: 'DELETE',
      token,
      errorMessage: 'Failed to delete entry.'
    });
  }

  deleteMotwEntry(steamID, discordID, token) {
    return this.httpClient.request(`/admin/leaderboards/${steamID}/motw/entries/${discordID}`, {
      method: 'DELETE',
      token,
      errorMessage: 'Failed to delete MOTW entry.'
    });
  }

  deleteMap(steamID, token) {
    return this.httpClient.request(`/admin/leaderboards/${steamID}`, {
      method: 'DELETE',
      token,
      errorMessage: 'Failed to delete map.'
    });
  }

  logMapPoints(steamID, token) {
    return this.httpClient.request(`/admin/leaderboards/${steamID}/map-points`, {
      token,
      errorMessage: 'Failed to log map points.'
    });
  }

  recomputeMapPoints(steamID, token) {
    return this.httpClient.request(`/admin/leaderboards/${steamID}/recompute-map-points`, {
      method: 'POST',
      token,
      errorMessage: 'Failed to recompute map points.'
    });
  }
}

