import { createHttpClient } from './httpClient';
import { LeaderboardsApi } from './leaderboardsApi';
import { UserApi } from './userApi';
import { AdminApi } from './adminApi';

export class Api {
  constructor(showError) {
    const httpClient = createHttpClient(showError);

    this.leaderboards = new LeaderboardsApi(httpClient);
    this.user = new UserApi(httpClient);
    this.admin = new AdminApi(httpClient);
  }
}

export const createApi = (showError) => new Api(showError);

