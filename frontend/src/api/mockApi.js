const MOCK_API_BASE_URL = '/mock-api';

export const USE_MOCK_API = process.env.REACT_APP_USE_MOCK_API === 'true';

const MOCK_RESPONSE_FILES = [
    {method: 'GET', pattern: /^\/leaderboards\/motw$/, file: `${MOCK_API_BASE_URL}/leaderboards-motw.json`},
    {method: 'GET', pattern: /^\/leaderboards\/recent$/, file: `${MOCK_API_BASE_URL}/leaderboards-recent.json`},
    {method: 'GET', pattern: /^\/leaderboards\/entries$/, file: `${MOCK_API_BASE_URL}/leaderboards-entries.json`},
    {method: 'GET', pattern: /^\/leaderboards\/?$/, file: `${MOCK_API_BASE_URL}/leaderboards.json`},
    {method: 'GET', pattern: /^\/leaderboards\/[^/]+$/, file: `${MOCK_API_BASE_URL}/leaderboards-by-steamid.json`},
    {method: 'POST', pattern: /^\/leaderboards\/?$/, file: `${MOCK_API_BASE_URL}/leaderboards-create.json`},
    {method: 'PATCH', pattern: /^\/leaderboards\/[^/]+\/motw$/, file: `${MOCK_API_BASE_URL}/leaderboards-motw-submit.json`},
    {
        method: 'PATCH',
        pattern: /^\/leaderboards\/[^/]+\/difficultyBonus$/,
        file: `${MOCK_API_BASE_URL}/leaderboards-difficulty-bonus.json`
    },
    {method: 'PATCH', pattern: /^\/leaderboards\/[^/]+$/, file: `${MOCK_API_BASE_URL}/leaderboards-entry-update.json`},
     {method: 'GET', pattern: /^\/user\/?$/, file: `${MOCK_API_BASE_URL}/users.json`},
     {method: 'GET', pattern: /^\/user\/top3$/, file: `${MOCK_API_BASE_URL}/users-top3.json`},
     {method: 'GET', pattern: /^\/user\/[^/]+\/update-points$/, file: `${MOCK_API_BASE_URL}/user-update-points.json`},
     {method: 'GET', pattern: /^\/user\/[^/]+$/, file: `${MOCK_API_BASE_URL}/user-by-id.json`},
    {method: 'POST', pattern: /^\/user\/validate-token$/, file: `${MOCK_API_BASE_URL}/user-validate-token.json`},
    {method: 'POST', pattern: /^\/user\/login$/, file: `${MOCK_API_BASE_URL}/user-login.json`},
    {method: 'POST', pattern: /^\/user\/login-discord$/, file: `${MOCK_API_BASE_URL}/user-login-discord.json`},
    {method: 'POST', pattern: /^\/user\/sign-up$/, file: `${MOCK_API_BASE_URL}/user-sign-up.json`},
    {method: 'POST', pattern: /^\/user\/sign-up-discord$/, file: `${MOCK_API_BASE_URL}/user-sign-up-discord.json`},
    {method: 'GET', pattern: /^\/admin\/status$/, file: `${MOCK_API_BASE_URL}/admin-status.json`},
    {
        method: 'DELETE',
        pattern: /^\/admin\/leaderboards\/[^/]+\/entries\/[^/]+$/,
        file: `${MOCK_API_BASE_URL}/admin-delete-entry.json`
    },
    {
        method: 'DELETE',
        pattern: /^\/admin\/leaderboards\/[^/]+\/motw\/entries\/[^/]+$/,
        file: `${MOCK_API_BASE_URL}/admin-delete-entry.json`
    }
];

const parseResponseBody = async (response) => {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
        return response.json();
    }

    return response.text().catch(() => null);
};

const getErrorMessage = (payload, fallbackMessage) => {
    const serverMessage = payload && typeof payload === 'object' ? payload.error || payload.message : null;
    return serverMessage || fallbackMessage;
};

const resolveMockFile = (method, path) => {
    const normalizedPath = new URL(path, 'https://mock-api.local').pathname;

    return MOCK_RESPONSE_FILES.find(({method: candidateMethod, pattern}) => {
        return candidateMethod === method && pattern.test(normalizedPath);
    })?.file;
};

export const requestMockResponse = async (method, path, errorMessage = 'Request failed.') => {
    const mockFile = resolveMockFile(method, path);

    if (!mockFile) {
        throw new Error(`No mock response mapped for ${method} ${path}`);
    }

    const response = await fetch(mockFile, {cache: 'no-store'});
    const payload = await parseResponseBody(response);

    if (!response.ok) {
        throw new Error(getErrorMessage(payload, errorMessage));
    }
    console.log(method, path, "->", payload);

    return payload;
};

