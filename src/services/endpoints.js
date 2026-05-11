import api from './api';

export const authService = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  signup: (userData) => api.post('/api/auth/signup', userData),
  logout: (refreshToken) => api.post('/api/auth/logout', { refreshToken }),
  refresh: (refreshToken) => api.post('/api/auth/refresh', { refreshToken }),
  getProfile: () => api.get('/api/auth/profile'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
  forgotPassword: (phone) => api.post('/api/auth/forgot-password', { phone }),
  resetPassword: (phone, otp, newPassword) => api.post('/api/auth/reset-password', { phone, otp, newPassword }),
};

export const serviceAPI = {
  getAll: (params = {}) => api.get('/api/services', { params }),
  getById: (id) => api.get(`/api/services/${id}`),
  create: (data) => api.post('/api/services', data),
  update: (id, data) => api.put(`/api/services/${id}`, data),
};

export const categoryService = {
  getAll: () => api.get('/api/categories'),
  getById: (id) => api.get(`/api/categories/${id}`),
};

export const orderService = {
  create: (data) => api.post('/api/orders', data),
  getAll: () => api.get('/api/orders'),
  getById: (id) => api.get(`/api/orders/${id}`),
  updateStatus: (id, status) => api.patch(`/api/orders/${id}/status`, { status }),
  // Meeting flow
  requestMeeting: (id, message) => api.post(`/api/orders/${id}/meeting/request`, { message }),
  shareMeetingLink: (id, data) => api.post(`/api/orders/${id}/meeting/link`, data),
  getMeeting: (id) => api.get(`/api/orders/${id}/meeting`),
  // Course meeting flow
  getCourseMeeting: (id) => api.get(`/api/orders/${id}/course-meeting`),
  setCourseMeetingLink: (id, data) => api.post(`/api/orders/${id}/course-meeting`, data),
};

export const courseService = {
  getAll: (params = {}) => api.get('/api/courses', { params }),
  getMine: () => api.get('/api/courses/me'),
  getById: (id) => api.get(`/api/courses/${id}`),
  create: (data) => api.post('/api/courses', data),
  update: (id, data) => api.put(`/api/courses/${id}`, data),
  enroll: (id) => api.post(`/api/courses/${id}/enroll`),
  shareMeeting: (id, data = {}) => api.post(`/api/courses/${id}/meeting/share`, data),
};

export const notificationService = {
  getAll: () => api.get('/api/notifications'),
  markRead: (id) => api.patch(`/api/notifications/${id}/read`),
  markAllRead: () => api.post('/api/notifications/read-all'),
};

export const paymentService = {
  initiate: (orderId) => api.post('/api/payments/initiate', { orderId }),
  verify: (data) => api.post('/api/payments/verify', data),
  getStatus: (orderId) => api.get(`/api/payments/${orderId}`),
  pollStatus: (paymentId) => api.get(`/api/payments/status/${paymentId}`),
};

export const otpService = {
  send: (phone) => api.post('/api/otp/send', { phone }),
  verify: (phone, otp) => api.post('/api/otp/verify', { phone, otp }),
};

export const walletService = {
  getWallet: () => api.get('/api/wallet'),
  getTransactions: (params = {}) => api.get('/api/wallet/transactions', { params }),
  addFunds: (amount) => api.post('/api/wallet/add-funds', { amount }),
  redeemCredits: (points) => api.post('/api/wallet/redeem-credits', { points }),
  pay: (orderId, useCredits = false) => api.post('/api/wallet/pay', { orderId, useCredits }),
};

export const offerService = {
  getAll: (params = {}) => api.get('/api/offers', { params }),
  apply: (code, subtotal) => api.post('/api/offers/apply', { code, subtotal }),
};

export const planService = {
  getAll: (params = {}) => api.get('/api/plans', { params }),
  getMy: () => api.get('/api/plans/my'),
  subscribe: (planId) => api.post('/api/plans/subscribe', { plan_id: planId }),
  cancel: () => api.post('/api/plans/cancel'),
  getRecommended: () => api.get('/api/plans/recommend'),
};

export const rideService = {
  estimate: (data) => api.post('/api/rides/estimate', data),
  book: (data) => api.post('/api/rides/book', data),
  getById: (rideId) => api.get(`/api/rides/${rideId}`),
  getAll: (params = {}) => api.get('/api/rides', { params }),
  cancel: (rideId, reason) => api.post(`/api/rides/${rideId}/cancel`, { reason }),
  start: (rideId, otp) => api.post(`/api/rides/${rideId}/start`, { otp }),
  complete: (rideId) => api.post(`/api/rides/${rideId}/complete`),
  rate: (rideId, rating, comment) => api.post(`/api/rides/${rideId}/rate`, { rating, comment }),
  getNearby: (params) => api.get('/api/rides/nearby', { params }),
  // Rider endpoints
  riderRegister: (data) => api.post('/api/rides/rider/register', data),
  riderProfile: () => api.get('/api/rides/rider/profile'),
  riderToggleOnline: (data) => api.post('/api/rides/rider/toggle-online', data),
  riderRequests: () => api.get('/api/rides/rider/requests'),
  riderAccept: (rideId) => api.post(`/api/rides/${rideId}/accept`),
  riderActive: () => api.get('/api/rides/rider/active'),
  riderHistory: (params = {}) => api.get('/api/rides/rider/history', { params }),
};
