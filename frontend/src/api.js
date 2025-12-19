import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000'
});

api.interceptors.response.use(
  res => res,
  async err => {
    const originalRequest = err.config;

    if (originalRequest.url.includes('/login')) {
      return Promise.reject(err);
    }

    // Logic cũ: Nếu lỗi 401 ở các API khác (không phải login) thì mới thử refresh
    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        // Chỉ redirect nếu đang không ở trang login để tránh lặp vô tận hoặc reload trang
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
        return Promise.reject(err);
      }

      try {
        const res = await api.post('/api/refresh-token', { refreshToken });
        const newAccessToken = res.data.accessToken;

        localStorage.setItem('accessToken', newAccessToken); 
        
        // Cập nhật header và gọi lại request cũ
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        localStorage.clear(); // Xóa sạch token cũ
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(err);
  }
);

export default api;