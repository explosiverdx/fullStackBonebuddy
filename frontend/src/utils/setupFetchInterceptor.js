const originalFetch = window.fetch.bind(window);
const REFRESH_ENDPOINT = '/api/v1/users/refresh-token';

let refreshPromise = null;

const getStoredToken = () => localStorage.getItem('accessToken');
const getStoredRefreshToken = () => localStorage.getItem('refreshToken');

const storeTokens = (accessToken, refreshToken) => {
  if (accessToken) {
    localStorage.setItem('accessToken', accessToken);
    window.dispatchEvent(new CustomEvent('auth:accessTokenUpdated', { detail: accessToken }));
  }
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
};

const tryRefreshToken = async () => {
  if (refreshPromise) {
    return refreshPromise;
  }

  const existingRefreshToken = getStoredRefreshToken();
  if (!existingRefreshToken) {
    return null;
  }

  refreshPromise = (async () => {
    try {
      const response = await originalFetch(REFRESH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: existingRefreshToken }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      const { accessToken, refreshToken } = data?.data || {};
      if (!accessToken) {
        throw new Error('No access token returned');
      }

      storeTokens(accessToken, refreshToken);
      return accessToken;
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

const attachAuthHeader = (headers) => {
  if (headers.has('Authorization')) {
    return;
  }
  const token = getStoredToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
};

const shouldBypassInterceptor = (input) => {
  if (typeof input !== 'string') {
    return true;
  }

  // Skip intercepting the refresh endpoint itself
  if (input === REFRESH_ENDPOINT) {
    return true;
  }

  return false;
};

window.fetch = async (input, init = {}) => {
  if (shouldBypassInterceptor(input)) {
    return originalFetch(input, init);
  }

  const options = { ...init };
  const headers = new Headers(options.headers || {});
  options.headers = headers;

  // Attach latest token before sending the request
  attachAuthHeader(headers);

  // Default to include cookies to keep parity with axios client
  if (!options.credentials) {
    options.credentials = 'include';
  }

  let response = await originalFetch(input, options);

  if (response.status !== 401) {
    return response;
  }

  const newAccessToken = await tryRefreshToken();
  if (!newAccessToken) {
    return response;
  }

  headers.set('Authorization', `Bearer ${newAccessToken}`);
  response = await originalFetch(input, options);

  return response;
};

