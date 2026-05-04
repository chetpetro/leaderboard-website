import { USE_MOCK_API, requestMockResponse } from './mockApi';

const API_BASE_URL = 'https://leaderboard-website-api.vercel.app/api';

const parseResponseBody = async (response) => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text().catch(() => null);
};

export class HttpClient {
  constructor(showError) {
    this.showError = showError;
  }

  async request(path, options = {}) {
    const {
      method = 'GET',
      body,
      headers = {},
      token,
      errorMessage = 'Request failed.'
    } = options;

    const executeRequest = async () => {
      if (USE_MOCK_API) {
        return requestMockResponse(method, path, errorMessage);
      }

      const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: {
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {})
      });

      const payload = await parseResponseBody(response);

      if (!response.ok) {
        let serverMessage =
          payload && typeof payload === 'object'
            ? payload.error || payload.message
            : null;
        if (response.status === 403) {
          serverMessage = "Most likely a new deployment caused vercel to break 😢. Fix: re-open the browser (not the tab)"
        }
        return Promise.reject(new Error(serverMessage || errorMessage));
      }

      return payload;
    };

    return executeRequest().catch((error) => {
      this.showError?.(error.message || errorMessage);
      return Promise.reject(error);
    });
  }
}

export const createHttpClient = (showError) => new HttpClient(showError);

