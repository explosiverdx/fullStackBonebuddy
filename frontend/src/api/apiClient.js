import axios from 'axios';

const API_BASE_URL = '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor - Add token to all requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  // Only add token if it exists and is not null/undefined/empty
  if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
    config.headers.Authorization = `Bearer ${token.trim()}`;
  }
  config.withCredentials = true;
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor - Handle 401 errors and refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip token refresh for admin OTP endpoints - these are login endpoints that should return 401 on failure
    const isAdminOtpEndpoint = originalRequest?.url?.includes('/admin/verify-otp') || 
                                originalRequest?.url?.includes('/admin/send-otp');

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh token for admin OTP endpoints - just return the error
      if (isAdminOtpEndpoint) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return apiClient(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        // No refresh token, logout
        isRefreshing = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Don't redirect if this is an admin OTP endpoint
        if (!isAdminOtpEndpoint) {
          window.location.href = '/';
        }
        return Promise.reject(error);
      }

      try {
        // Try to refresh the token
        const response = await axios.post(
          '/api/v1/users/refresh-token',
          { refreshToken },
          { withCredentials: true }
        );

        if (response.data && response.data.data) {
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          
          localStorage.setItem('accessToken', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }

          // Update authorization header
          apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken;
          originalRequest.headers['Authorization'] = 'Bearer ' + accessToken;

          processQueue(null, accessToken);
          isRefreshing = false;

          // Retry the original request
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Don't redirect if this is an admin OTP endpoint
        if (!isAdminOtpEndpoint) {
          window.location.href = '/';
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;