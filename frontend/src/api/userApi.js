export class UserApi {
  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  fetchAll() {
    return this.httpClient.request('/user/', {
      errorMessage: 'Failed to load users.'
    });
  }

  fetchById(discordID) {
    return this.httpClient.request(`/user/${discordID}`, {
      errorMessage: 'Failed to load user data.'
    });
  }

  updatePoints(discordID) {
    return this.httpClient.request(`/user/${discordID}/update-points`, {
      errorMessage: 'Failed to update user points.'
    });
  }

  validateToken(token) {
    return this.httpClient.request('/user/validate-token', {
      method: 'POST',
      body: { token },
      errorMessage: 'Token validation failed.'
    });
  }

  login(credentials) {
    return this.httpClient.request('/user/login', {
      method: 'POST',
      body: credentials,
      errorMessage: 'Login failed.'
    });
  }

  loginDiscord(payload) {
    return this.httpClient.request('/user/login-discord', {
      method: 'POST',
      body: payload,
      errorMessage: 'Discord login failed.'
    });
  }

  signup(payload) {
    return this.httpClient.request('/user/sign-up', {
      method: 'POST',
      body: payload,
      errorMessage: 'Sign up failed.'
    });
  }

  signupDiscord(payload) {
    return this.httpClient.request('/user/sign-up-discord', {
      method: 'POST',
      body: payload,
      errorMessage: 'Discord sign up failed.'
    });
  }
}

