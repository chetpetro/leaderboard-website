export class AdminApi {
  constructor(httpClient) {
    this.httpClient = httpClient;
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
}

